import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../db/connection';

export const authRouter = Router();

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in Production.');
    }
    return 'development-temporary-jwt-secret-key-do-not-use-in-prod-12345';
  }
  return secret;
}

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
  }

  try {
    const userRes = await pool.query(`
      SELECT u.*, r.name as role_name 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1 OR u.username = $1
    `, [email]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'بيانات الاعتماد غير صحيحة' });
    }

    const user = userRes.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'هذا الحساب معطل' });
    }

    // Verify password with bcrypt (with fallback check for legacy pbkdf2 if needed)
    let isMatch = false;
    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2y$')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else if (user.password_hash.includes(':')) {
      const crypto = await import('crypto');
      const [salt, key] = user.password_hash.split(':');
      const hashedBuffer = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');
      const keyBuffer = Buffer.from(key, 'hex');
      isMatch = crypto.timingSafeEqual(hashedBuffer, keyBuffer);
      
      // Auto-migrate legacy hash to bcrypt on successful login
      if (isMatch) {
        const newBcryptHash = await bcrypt.hash(password, 12);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newBcryptHash, user.id]);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'بيانات الاعتماد غير صحيحة' });
    }

    // Generate JWT Token with issuer, subject, expiration
    const secret = getJwtSecret();
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role_name, 
        email: user.email 
      },
      secret,
      { 
        expiresIn: '24h',
        issuer: 'naw3iya-auth-service',
        subject: String(user.id)
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role_name,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

authRouter.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'غير مصرح' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      issuer: 'naw3iya-auth-service',
    }) as any;
    
    // Always refresh user role and active state directly from database to prevent token privilege stale/escalation
    const userRes = await pool.query(`
      SELECT u.*, r.name as role_name 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [decoded.userId]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    const user = userRes.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'هذا الحساب تم تعطيله' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role_name,
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'الجلسة منتهية أو الرمز غير صالح' });
  }
});
