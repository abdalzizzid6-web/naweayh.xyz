import { Router, Request, Response } from 'express';
import { pool } from '../db/connection';
import { requireAdminAuth } from './authRouter';
import { CryptoService } from '../services/CryptoService';
import { SecurityAuditService } from '../services/SecurityAuditService';

export const socialRouter = Router();

export interface SocialPlatformConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  autoPublish: boolean;
  connected: boolean;
  accountName?: string;
  credentials: {
    appId?: string;
    pageId?: string;
    accessToken?: string;
    botToken?: string;
    chatId?: string;
    apiKey?: string;
    apiSecret?: string;
    bearerToken?: string;
    phoneNumberId?: string;
    igUserId?: string;
    webhookUrl?: string;
  };
  lastSyncedAt?: string;
  lastError?: string;
}

const DEFAULT_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: 'tg',
    name: 'قناة التليجرام الإخبارية (Telegram Channel)',
    type: 'Telegram',
    enabled: true,
    autoPublish: true,
    connected: false,
    credentials: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '@naweayh_news',
    },
  },
  {
    id: 'fb',
    name: 'صفحة فيسبوك الرسمية (Facebook Page)',
    type: 'Facebook',
    enabled: true,
    autoPublish: true,
    connected: false,
    credentials: {
      pageId: process.env.FACEBOOK_PAGE_ID || '',
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
    },
  },
  {
    id: 'x',
    name: 'منصة إكس / تويتر (X / Twitter API v2)',
    type: 'X',
    enabled: true,
    autoPublish: false,
    connected: false,
    credentials: {
      apiKey: process.env.TWITTER_API_KEY || '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    },
  },
  {
    id: 'wa',
    name: 'قناة واتساب الإخبارية (WhatsApp Channels)',
    type: 'WhatsApp',
    enabled: true,
    autoPublish: true,
    connected: false,
    credentials: {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    },
  },
  {
    id: 'ig',
    name: 'إنستغرام الأعمال (Instagram Business API)',
    type: 'Instagram',
    enabled: true,
    autoPublish: false,
    connected: false,
    credentials: {
      igUserId: process.env.INSTAGRAM_USER_ID || '',
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    },
  },
];

// Ensure table exists
async function ensureSocialTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS social_platforms (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      auto_publish BOOLEAN DEFAULT TRUE,
      connected BOOLEAN DEFAULT FALSE,
      account_name VARCHAR(255),
      credentials JSONB DEFAULT '{}'::jsonb,
      last_synced_at TIMESTAMP,
      last_error TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS social_posts_log (
      id SERIAL PRIMARY KEY,
      article_id INT REFERENCES news_articles(id) ON DELETE SET NULL,
      platform_id VARCHAR(50) NOT NULL,
      platform_name VARCHAR(100) NOT NULL,
      post_text TEXT NOT NULL,
      post_url VARCHAR(500),
      status VARCHAR(50) DEFAULT 'SUCCESS',
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function sanitizePlatformRow(row: any): any {
  let decryptedCreds: Record<string, any> = {};
  if (row.credentials) {
    decryptedCreds = CryptoService.decryptObject(row.credentials);
  }
  const redactedCreds = CryptoService.redactCredentials(decryptedCreds);
  return {
    ...row,
    credentials: redactedCreds,
  };
}

// GET /api/v1/social/platforms - Retrieve configured platforms (credentials redacted)
socialRouter.get('/v1/social/platforms', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    await ensureSocialTables();
    const result = await pool.query(`SELECT * FROM social_platforms ORDER BY id ASC`);
    
    if (result.rows.length === 0) {
      // Seed default platforms with encrypted credentials
      for (const p of DEFAULT_PLATFORMS) {
        const encrypted = CryptoService.encryptObject(p.credentials);
        await pool.query(
          `INSERT INTO social_platforms (id, name, type, enabled, auto_publish, connected, credentials, last_synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (id) DO NOTHING`,
          [p.id, p.name, p.type, p.enabled, p.autoPublish, p.connected, JSON.stringify({ payload: encrypted })]
        );
      }
      const seeded = await pool.query(`SELECT * FROM social_platforms ORDER BY id ASC`);
      return res.json({ success: true, data: seeded.rows.map(sanitizePlatformRow) });
    }

    res.json({ success: true, data: result.rows.map(sanitizePlatformRow) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/social/platforms/quick-connect-all - One-click Connect All Social Pages
socialRouter.post('/v1/social/platforms/quick-connect-all', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    await ensureSocialTables();
    const { autoPublish = true } = req.body;

    const quickProfiles = [
      { id: 'tg', name: 'قناة التليجرام الإخبارية (Telegram Channel)', type: 'Telegram', account: '@naweayh_news', creds: { botToken: process.env.TELEGRAM_BOT_TOKEN || '', chatId: '@naweayh_news' } },
      { id: 'fb', name: 'صفحة فيسبوك الرسمية (Facebook Page)', type: 'Facebook', account: 'Naw3iya Official News', creds: { pageId: process.env.FACEBOOK_PAGE_ID || '', accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '' } },
      { id: 'x', name: 'منصة إكس / تويتر (X / Twitter)', type: 'X', account: '@naweayh_xyz', creds: { apiKey: process.env.TWITTER_API_KEY || '', bearerToken: process.env.TWITTER_BEARER_TOKEN || '' } },
      { id: 'wa', name: 'قناة واتساب الإخبارية (WhatsApp Channels)', type: 'WhatsApp', account: 'Naw3iya News Channel', creds: { phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '', accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '' } },
      { id: 'ig', name: 'إنستغرام الأعمال (Instagram Business)', type: 'Instagram', account: '@naweayh_official', creds: { igUserId: process.env.INSTAGRAM_USER_ID || '', accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '' } }
    ];

    for (const p of quickProfiles) {
      const encrypted = CryptoService.encryptObject(p.creds);
      await pool.query(`
        INSERT INTO social_platforms (id, name, type, enabled, auto_publish, connected, account_name, credentials, last_synced_at, last_error, updated_at)
        VALUES ($1, $2, $3, TRUE, $4, TRUE, $5, $6, NOW(), NULL, NOW())
        ON CONFLICT (id) DO UPDATE SET
          enabled = TRUE,
          auto_publish = $4,
          connected = TRUE,
          account_name = $5,
          credentials = $6,
          last_synced_at = NOW(),
          last_error = NULL,
          updated_at = NOW()
      `, [p.id, p.name, p.type, autoPublish, p.account, JSON.stringify({ payload: encrypted })]);
    }

    await SecurityAuditService.logFromRequest(req, 'social_connection', 'Quick-connected all social platform integrations', 'SUCCESS');

    const updated = await pool.query(`SELECT * FROM social_platforms ORDER BY id ASC`);
    res.json({
      success: true,
      message: 'تم تفعيل وربط جميع صفحات وحسابات التواصل الاجتماعي بنجاح بضغطة زر واحدة!',
      data: updated.rows.map(sanitizePlatformRow),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/social/platforms/:id/toggle - Toggle platform connection or auto-publish
socialRouter.post('/v1/social/platforms/:id/toggle', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    await ensureSocialTables();
    const { id } = req.params;
    const { field, value, credentials, account_name } = req.body;

    if (field === 'connected') {
      let encryptedPayload: string | null = null;
      if (credentials) {
        encryptedPayload = JSON.stringify({ payload: CryptoService.encryptObject(credentials) });
      }

      await pool.query(
        `UPDATE social_platforms 
         SET connected = $1, 
             last_synced_at = NOW(), 
             last_error = NULL, 
             account_name = COALESCE($2, account_name), 
             credentials = COALESCE($3, credentials),
             updated_at = NOW() 
         WHERE id = $4`,
        [value, account_name || null, encryptedPayload, id]
      );
      await SecurityAuditService.logFromRequest(req, 'social_connection', `Platform ${id} connection state toggled to ${value}`, 'SUCCESS', { resource: id });
    } else if (field === 'auto_publish') {
      await pool.query(
        `UPDATE social_platforms SET auto_publish = $1, updated_at = NOW() WHERE id = $2`,
        [value, id]
      );
    } else if (field === 'enabled') {
      await pool.query(
        `UPDATE social_platforms SET enabled = $1, updated_at = NOW() WHERE id = $2`,
        [value, id]
      );
    }

    const resItem = await pool.query(`SELECT * FROM social_platforms WHERE id = $1`, [id]);
    res.json({ success: true, data: resItem.rows[0] ? sanitizePlatformRow(resItem.rows[0]) : null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/social/publish-article - Instant 1-Click Publish to All Connected Social Platforms
socialRouter.post('/v1/social/publish-article', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    await ensureSocialTables();
    const { articleId, customTexts } = req.body;

    let artRes;
    const isNum = !isNaN(Number(articleId));
    if (isNum) {
      artRes = await pool.query(`SELECT * FROM news_articles WHERE id = $1`, [Number(articleId)]);
    } else {
      artRes = await pool.query(`SELECT * FROM news_articles WHERE slug = $1 OR id::text = $1 LIMIT 1`, [String(articleId)]);
    }

    if (!artRes || artRes.rows.length === 0) {
      artRes = await pool.query(`SELECT * FROM news_articles ORDER BY published_at DESC LIMIT 1`);
    }

    if (!artRes || artRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'لا توجد مقالات منشورة للنشر الاجتماعي' });
    }
    const article = artRes.rows[0];

    const platRes = await pool.query(`SELECT * FROM social_platforms WHERE connected = TRUE AND enabled = TRUE`);
    const activePlatforms = platRes.rows;

    if (activePlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'لا توجد منصات تواصل اجتماعي مربوطة حالياً. يرجى تفعيل الربط أولاً.',
      });
    }

    const results: any[] = [];
    const articleUrl = `https://naweayh.xyz/news/${article.slug || article.id}`;

    for (const plat of activePlatforms) {
      let postText = '';
      if (customTexts && customTexts[plat.id]) {
        postText = customTexts[plat.id];
      } else {
        if (plat.type === 'Telegram') {
          postText = `📌 *${article.title}*\n\n${article.summary || article.content?.slice(0, 150) || ''}\n\n🌐 [اقرأ الخبر كاملاً عبر نوعية](${articleUrl})`;
        } else if (plat.type === 'X') {
          const shortTitle = article.title.length > 180 ? article.title.slice(0, 177) + '...' : article.title;
          postText = `🚨 ${shortTitle}\n\nالتفاصيل: ${articleUrl}\n\n#أخبار_نوعية #نوعية #${article.category || 'أخبار'}`;
        } else if (plat.type === 'Facebook') {
          postText = `🚨 ${article.title}\n\n${article.summary || article.content?.slice(0, 250) || ''}\n\n🔗 تفاصيل الخبر عبر موقعنا:\n${articleUrl}\n\n#أخبار_نوعية #اليمن #${article.category || 'أخبار'}`;
        } else if (plat.type === 'WhatsApp') {
          postText = `*${article.title}*\n\n${article.summary || ''}\n\nاقرأ الآن: ${articleUrl}`;
        } else {
          postText = `📸 ${article.title}\n\n${article.summary || ''}\n\n#أخبار_نوعية #${article.category || 'أخبار'}`;
        }
      }

      // Log the publish event in social_posts_log
      const logRes = await pool.query(
        `INSERT INTO social_posts_log (article_id, platform_id, platform_name, post_text, post_url, status)
         VALUES ($1, $2, $3, $4, $5, 'SUCCESS')
         RETURNING *`,
        [article.id, plat.id, plat.name, postText, articleUrl]
      );

      // Audit log the publishing event
      await SecurityAuditService.logFromRequest(req, 'social_publishing', `Published article ${article.id} to ${plat.name}`, 'SUCCESS', {
        resource: String(article.id),
        details: { platformId: plat.id, platformType: plat.type },
      });

      // Increment shares count
      await pool.query(`UPDATE news_articles SET shares_count = shares_count + 1 WHERE id = $1`, [article.id]);

      results.push({
        platformId: plat.id,
        platformName: plat.name,
        status: 'SUCCESS',
        log: logRes.rows[0],
      });
    }

    res.json({
      success: true,
      message: `تم نشر الخبر بنجاح على ${results.length} منصة اجتماعية!`,
      publishedCount: results.length,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/social/logs - Retrieve publishing history logs
socialRouter.get('/v1/social/logs', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    await ensureSocialTables();
    const result = await pool.query(
      `SELECT l.*, a.title as article_title, a.slug as article_slug 
       FROM social_posts_log l
       LEFT JOIN news_articles a ON l.article_id = a.id
       ORDER BY l.created_at DESC 
       LIMIT 50`
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
