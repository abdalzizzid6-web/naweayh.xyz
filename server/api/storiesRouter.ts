import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/connection';
import { storyClusteringService } from '../services/StoryClusteringService';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './authRouter';

export const storiesApiRouter = Router();

const checkAdminRole = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'غير مصرح لك بالوصول. الرجاء تسجيل الدخول.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      issuer: 'naw3iya-auth-service',
    }) as any;
    const userRole = decoded.role;
    const allowedRoles = ['System Admin', 'Super Admin', 'Admin', 'Editor-in-Chief', 'Editor', 'Author', 'Moderator', 'Analyst'];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'غير مصرح لك بالوصول (RBAC).' });
    }
    
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'الجلسة منتهية أو غير صالحة' });
  }
};

// GET /api/v1/stories - List story clusters
storiesApiRouter.get(['/v1/stories', '/stories'], async (req, res) => {
  try {
    const { category, country, status = 'ACTIVE', search, limit = '20', page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT sc.*, 
             (SELECT cover_image_url FROM news_articles WHERE story_cluster_id = sc.id ORDER BY published_at DESC LIMIT 1) as cover_image_url
      FROM story_clusters sc
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND sc.status = $${paramIndex++}`;
      params.push(status);
    }
    if (category && category !== 'الكل') {
      query += ` AND sc.category = $${paramIndex++}`;
      params.push(category);
    }
    if (country) {
      query += ` AND sc.country = $${paramIndex++}`;
      params.push(country);
    }
    if (search) {
      query += ` AND (sc.title ILIKE $${paramIndex} OR sc.summary ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY sc.importance_score DESC, sc.last_updated_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    // Count total
    const countRes = await pool.query(`SELECT COUNT(*) FROM story_clusters WHERE status = 'ACTIVE'`);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    res.json({
      success: true,
      count: result.rows.length,
      total,
      page: pageNum,
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/stories/:slugOrId - Single story cluster detail
storiesApiRouter.get(['/v1/stories/:slugOrId', '/stories/:slugOrId'], async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let query = `SELECT * FROM story_clusters WHERE `;
    const param = isNaN(Number(slugOrId)) ? { text: 'slug = $1', val: slugOrId } : { text: 'id = $1', val: parseInt(slugOrId, 10) };

    const storyRes = await pool.query(query + param.text, [param.val]);
    if (storyRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'القصة الإخبارية غير موجودة' });
    }

    const story = storyRes.rows[0];

    // Fetch articles in this cluster
    const articlesRes = await pool.query(
      `SELECT a.*, s.name_arabic as source_name, s.logo as source_logo, s.trust_score as source_trust
       FROM news_articles a
       LEFT JOIN news_sources s ON a.source_id = s.id
       WHERE a.story_cluster_id = $1
       ORDER BY a.published_at DESC`,
      [story.id]
    );

    // Fetch sources in this cluster
    const sourcesRes = await pool.query(
      `SELECT DISTINCT s.id, s.name_arabic as name, s.logo, s.trust_score, s.url
       FROM news_sources s
       JOIN news_articles a ON a.source_id = s.id
       WHERE a.story_cluster_id = $1`,
      [story.id]
    );

    res.json({
      success: true,
      data: {
        ...story,
        articles: articlesRes.rows,
        sources: sourcesRes.rows,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/stories/:id/articles
storiesApiRouter.get('/v1/stories/:id/articles', async (req, res) => {
  try {
    const { id } = req.params;
    const articlesRes = await pool.query(
      `SELECT a.*, s.name_arabic as source_name, s.logo as source_logo, s.trust_score as source_trust
       FROM news_articles a
       LEFT JOIN news_sources s ON a.source_id = s.id
       WHERE a.story_cluster_id = $1
       ORDER BY a.published_at DESC`,
      [id]
    );
    res.json({ success: true, count: articlesRes.rows.length, data: articlesRes.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/stories/:id/sources
storiesApiRouter.get('/v1/stories/:id/sources', async (req, res) => {
  try {
    const { id } = req.params;
    const sourcesRes = await pool.query(
      `SELECT DISTINCT s.id, s.name_arabic as name, s.logo, s.trust_score, s.url, COUNT(a.id) as articles_count
       FROM news_sources s
       JOIN news_articles a ON a.source_id = s.id
       WHERE a.story_cluster_id = $1
       GROUP BY s.id`,
      [id]
    );
    res.json({ success: true, count: sourcesRes.rows.length, data: sourcesRes.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/stories/:id/timeline
storiesApiRouter.get('/v1/stories/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;
    const articlesRes = await pool.query(
      `SELECT a.id, a.title, a.summary, a.published_at, a.original_article_url, s.name_arabic as source_name, s.logo as source_logo
       FROM news_articles a
       LEFT JOIN news_sources s ON a.source_id = s.id
       WHERE a.story_cluster_id = $1
       ORDER BY a.published_at ASC`,
      [id]
    );
    res.json({ success: true, count: articlesRes.rows.length, data: articlesRes.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/stories/:id/related
storiesApiRouter.get('/v1/stories/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const storyRes = await pool.query(`SELECT category, country FROM story_clusters WHERE id = $1`, [id]);
    if (storyRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'القصة غير موجودة' });
    }
    const { category, country } = storyRes.rows[0];

    const relatedRes = await pool.query(
      `SELECT sc.*, (SELECT cover_image_url FROM news_articles WHERE story_cluster_id = sc.id ORDER BY published_at DESC LIMIT 1) as cover_image_url
       FROM story_clusters sc
       WHERE sc.id != $1 AND (sc.category = $2 OR sc.country = $3)
       ORDER BY sc.last_updated_at DESC
       LIMIT 5`,
      [id, category, country]
    );
    res.json({ success: true, count: relatedRes.rows.length, data: relatedRes.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN ENDPOINTS (Protected)
// POST /api/v1/admin/stories/:id/merge
storiesApiRouter.post('/v1/admin/stories/:id/merge', checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { targetClusterId } = req.body;
    if (!targetClusterId) {
      return res.status(400).json({ success: false, message: 'targetClusterId مطلوب' });
    }
    const success = await storyClusteringService.mergeClusters(parseInt(id, 10), parseInt(targetClusterId, 10));
    res.json({ success, message: success ? 'تم دمج القصص بنجاح' : 'فشل دمج القصص' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/admin/stories/:id/split
storiesApiRouter.post('/v1/admin/stories/:id/split', checkAdminRole, async (req, res) => {
  try {
    const { articleId } = req.body;
    if (!articleId) {
      return res.status(400).json({ success: false, message: 'articleId مطلوب' });
    }
    const newClusterId = await storyClusteringService.splitArticle(parseInt(articleId, 10));
    res.json({ success: !!newClusterId, newClusterId, message: newClusterId ? 'تم فصل المقال بنجاح' : 'فشل فصل المقال' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/admin/stories/:id/assign
storiesApiRouter.post('/v1/admin/stories/:id/assign', checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { articleId } = req.body;
    if (!articleId) {
      return res.status(400).json({ success: false, message: 'articleId مطلوب' });
    }
    await storyClusteringService.assignArticleToCluster(parseInt(articleId, 10), parseInt(id, 10));
    res.json({ success: true, message: 'تم تعيين المقال للقصة بنجاح' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/admin/stories/:id/archive
storiesApiRouter.post('/v1/admin/stories/:id/archive', checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE story_clusters SET status = 'ARCHIVED' WHERE id = $1`, [id]);
    res.json({ success: true, message: 'تم أرشفة القصة بنجاح' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
