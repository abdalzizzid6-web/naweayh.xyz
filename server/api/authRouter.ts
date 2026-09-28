import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool, ensureDbInitialized } from '../db/connection';
import { RateLimiterService } from '../services/RateLimiterService';
import { SecurityAuditService, extractClientIp } from '../services/SecurityAuditService';
import { validateRequest, CommonSchemas } from '../services/ValidationService';

export const authRouter = Router();

export const COOKIE_NAME = '__admin_session';
export const JWT_ISSUER = 'https://naweayh.xyz';
export const JWT_AUDIENCE = 'naweayh-admin-portal';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is mandatory in production.');
    }
    return 'naw3iya-enterprise-secure-jwt-secret-key-2026-auth';
  }
  return secret;
}

/**
 * Extracts authentication token from either HttpOnly Cookie or Authorization Bearer header.
 */
export function extractToken(req: Request): string | null {
  // 1. Prefer HttpOnly Cookie for browser sessions
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }

  // 2. Fall back to standard Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Central Base Authentication Middleware
 * Validates JWT signature, expiration, issuer, audience, and database session revocation state.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'جلسة العمل غير متوفرة. يرجى تسجيل الدخول للمتابعة.',
    });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'],
    }) as any;

    if (!decoded || !decoded.userId || !decoded.jti) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN_CLAIMS',
        message: 'بيانات الاعتماد غير صالحة.',
      });
    }

    await ensureDbInitialized();

    // Verify session in auth_sessions table to ensure it has not been revoked
    const sessionRes = await pool.query(
      `SELECT s.id, s.user_id, s.role, s.revoked, s.expires_at, u.is_active, u.email
       FROM auth_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1 LIMIT 1`,
      [decoded.jti]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_NOT_FOUND',
        message: 'الجلسة غير مسجلة أو تم إبطالها من الخادم.',
      });
    }

    const session = sessionRes.rows[0];

    if (session.revoked) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_REVOKED',
        message: 'تم إبطال هذه الجلسة مسبقاً. يرجى تسجيل الدخول مجدداً.',
      });
    }

    if (new Date(session.expires_at) <= new Date()) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_EXPIRED',
        message: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.',
      });
    }

    if (!session.is_active) {
      return res.status(403).json({
        success: false,
        code: 'USER_INACTIVE',
        message: 'هذا الحساب تم تعطيله من قبل الإدارة.',
      });
    }

    // Attach authenticated identity to request (UI can NEVER spoof userId)
    (req as any).user = {
      userId: session.user_id,
      role: session.role,
      email: session.email,
      sessionId: session.id,
    };

    // Update session last active timestamp asynchronously
    pool.query('UPDATE auth_sessions SET last_active_at = NOW() WHERE id = $1', [session.id]).catch(() => {});

    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'الجلسة منتهية أو الرمز غير صالح.',
    });
  }
}

/**
 * Unified Admin Authorization Middleware
 */
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      SecurityAuditService.logFromRequest(req, 'access_denied', 'Admin role required', 'BLOCKED', {
        resource: req.originalUrl,
      });
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'صلاحيات مدير النظام مطلوبة للوصول إلى هذا القسم.',
      });
    }
    next();
  });
}

/**
 * Role-Based Authorization Middleware generator
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await requireAuth(req, res, () => {
      const user = (req as any).user;
      if (!user || !allowedRoles.includes(user.role)) {
        SecurityAuditService.logFromRequest(req, 'access_denied', `Required roles: ${allowedRoles.join(',')}`, 'BLOCKED', {
          resource: req.originalUrl,
        });
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
        });
      }
      next();
    });
  };
}

// -------------------------------------------------------------
// POST /api/v1/auth/login - Secure Admin Login with Rate Limiting
// -------------------------------------------------------------
const limits = RateLimiterService.getLimits();

authRouter.post(
  '/login',
  RateLimiterService.middleware({
    keyPrefix: 'login',
    maxPoints: limits.loginMax,
    windowSeconds: limits.loginWindowSec,
    message: 'تم تجاوز الحد المسموح به لمحاولات تسجيل الدخول. يرجى الانتظار 15 دقيقة قبل المحاولة ثانية.',
  }),
  validateRequest({ body: CommonSchemas.loginBody }),
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    try {
      await ensureDbInitialized();

      // Look up user strictly by email or username 'admin'
      const userRes = await pool.query(
        'SELECT id, username, email, password_hash, is_active FROM users WHERE LOWER(email) = $1 OR username = $2 LIMIT 1',
        [cleanEmail, 'admin']
      );

      // SECURITY RULE: Never auto-create admin from login endpoint!
      if (userRes.rows.length === 0) {
        await SecurityAuditService.logFromRequest(req, 'login', 'Login failed: Account not found', 'FAILURE', {
          details: { attemptEmail: cleanEmail },
        });
        return res.status(401).json({ success: false, message: 'بيانات الاعتماد غير صحيحة' });
      }

      const user = userRes.rows[0];
      if (!user.is_active) {
        await SecurityAuditService.logFromRequest(req, 'login', 'Login rejected: Inactive account', 'BLOCKED', {
          userId: user.id,
          userEmail: user.email,
        });
        return res.status(403).json({ success: false, message: 'هذا الحساب تم تعطيله' });
      }

      // Verify password with bcrypt
      let isMatch = false;
      if (user.password_hash) {
        if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2y$')) {
          isMatch = await bcrypt.compare(cleanPassword, user.password_hash);
        } else if (user.password_hash.includes(':')) {
          // PBKDF2 legacy check
          const [salt, key] = user.password_hash.split(':');
          const hashedBuffer = crypto.pbkdf2Sync(cleanPassword, salt, 1000, 64, 'sha512');
          const keyBuffer = Buffer.from(key, 'hex');
          isMatch = crypto.timingSafeEqual(hashedBuffer, keyBuffer);
        }
      }

      if (!isMatch) {
        await SecurityAuditService.logFromRequest(req, 'login', 'Login failed: Invalid password', 'FAILURE', {
          userId: user.id,
          userEmail: user.email,
        });
        return res.status(401).json({ success: false, message: 'بيانات الاعتماد غير صحيحة' });
      }

      // If needed, upgrade legacy hash to standard bcrypt with work factor 12 in production
      const targetRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
      const newHash = await bcrypt.hash(cleanPassword, targetRounds);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);

      // Generate cryptographically secure session ID
      const sessionId = crypto.randomBytes(32).toString('hex');
      const sessionDurationHours = 24;
      const expiresAt = new Date(Date.now() + sessionDurationHours * 60 * 60 * 1000);
      const ip = extractClientIp(req);
      const userAgent = (req.headers['user-agent'] as string) || '';

      // Persist session to PostgreSQL
      await pool.query(
        `INSERT INTO auth_sessions (id, user_id, role, ip_address, user_agent, revoked, expires_at)
         VALUES ($1, $2, 'admin', $3, $4, FALSE, $5)`,
        [sessionId, user.id, ip, userAgent.slice(0, 500), expiresAt]
      );

      // Sign JWT with full claims: issuer, audience, jti
      const secret = getJwtSecret();
      const token = jwt.sign(
        {
          userId: user.id,
          role: 'admin',
          email: user.email,
        },
        secret,
        {
          expiresIn: '24h',
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
          subject: String(user.id),
          jwtid: sessionId,
        }
      );

      // Set HttpOnly, SameSite, Secure Cookie
      const isSecure = process.env.NODE_ENV === 'production' || req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https';
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: sessionDurationHours * 60 * 60 * 1000,
        path: '/',
      });

      // Audit Log Success
      await SecurityAuditService.logFromRequest(req, 'login', 'Admin logged in successfully', 'SUCCESS', {
        userId: user.id,
        userEmail: user.email,
        details: { sessionId },
      });

      res.json({
        success: true,
        token, // returned for clients that also pass Bearer headers
        user: {
          id: user.id,
          name: 'مدير النظام',
          email: user.email,
          role: 'admin',
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة الطلب في الخادم' });
    }
  }
);

// -------------------------------------------------------------
// POST /api/v1/auth/logout - Real Session Invalidation & Cookie Clear
// -------------------------------------------------------------
authRouter.post('/logout', async (req: Request, res: Response) => {
  const token = extractToken(req);

  if (token) {
    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        algorithms: ['HS256'],
        ignoreExpiration: true, // allow revoking expired or semi-expired tokens
      }) as any;

      if (decoded && decoded.jti) {
        await pool.query('UPDATE auth_sessions SET revoked = TRUE WHERE id = $1', [decoded.jti]);
        await SecurityAuditService.logFromRequest(req, 'logout', 'Admin logged out (session revoked)', 'SUCCESS', {
          userId: decoded.userId,
          userEmail: decoded.email,
          details: { sessionId: decoded.jti },
        });
      }
    } catch {
      // Ignore token verification errors during logout
    }
  }

  // Clear cookie completely
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح وإبطال جلسة العمل.',
  });
});

// -------------------------------------------------------------
// GET /api/v1/auth/verify - Verify Session
// -------------------------------------------------------------
authRouter.get('/verify', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    success: true,
    user: {
      id: user.userId,
      name: 'مدير النظام',
      email: user.email,
      role: user.role,
    },
  });
});

// -------------------------------------------------------------
// GET /api/v1/admin/audit-logs - View Security Audit Logs (Admin only)
// -------------------------------------------------------------
authRouter.get('/audit-logs', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
    const offset = parseInt((req.query.offset as string) || '0', 10);
    const logs = await SecurityAuditService.getRecentLogs(limit, offset);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
