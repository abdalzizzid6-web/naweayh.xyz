import re

with open('server/api/newsRouter.ts', 'r') as f:
    content = f.read()

# Replace GET /v1/sources
new_get_sources = """// GET /api/v1/sources
newsApiRouter.get(['/v1/sources', '/sources'], async (_req, res) => {
  try {
    const dbRes = await pool.query('SELECT * FROM news_sources ORDER BY priority DESC, id ASC');
    res.json({ success: true, count: dbRes.rowCount, data: dbRes.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
"""
content = re.sub(
    r"// GET /api/v1/sources.*?}\);", 
    new_get_sources, 
    content, 
    flags=re.DOTALL
)

# Replace POST /v1/sources
new_post_sources = """// POST /api/v1/sources - Add new news source
newsApiRouter.post('/v1/sources', async (req, res) => {
  try {
    const { name, url, feedUrl, logo, country, language, category, type, trustScore, priority, enabled } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, message: 'الاسم والرابط مطلوبان' });
    }

    const insertQuery = `
      INSERT INTO news_sources (name, name_arabic, url, feed_url, logo, country, language, category, type, enabled, priority, trust_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const params = [
      name, name, url, feedUrl || url, logo || '', country || 'اليمن', language || 'ar', 
      category || 'أخبار عامة', type || 'RSS', enabled !== undefined ? enabled : true, 
      priority || 2, trustScore || 90
    ];
    
    const dbRes = await pool.query(insertQuery, params);

    res.json({ success: true, data: dbRes.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});"""
content = re.sub(
    r"// POST /api/v1/sources - Add new news source.*?}\);", 
    new_post_sources, 
    content, 
    flags=re.DOTALL
)

# Replace POST /v1/sources/:id/test
new_post_sources_test = """// POST /api/v1/sources/:id/test - Test HTTP Connection to Source Feed
newsApiRouter.post('/v1/sources/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const dbRes = await pool.query('SELECT * FROM news_sources WHERE id = $1', [id]);
    
    if (dbRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'المصدر غير موجود' });
    }
    
    const source = dbRes.rows[0];
    const startTime = Date.now();
    
    const response = await fetch(source.feed_url || source.url, {
      method: 'GET',
      headers: { 'User-Agent': 'Naw3iyaNewsBot/2.5' },
      signal: AbortSignal.timeout(6000)
    });
    
    const responseTimeMs = Date.now() - startTime;
    
    if (!response.ok) {
      await pool.query('UPDATE news_sources SET last_error_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
      return res.json({ 
        success: false, 
        message: `فشل الاتصال: ${response.status} ${response.statusText}`,
        responseTimeMs
      });
    }
    
    const text = await response.text();
    await pool.query('UPDATE news_sources SET last_success_at = CURRENT_TIMESTAMP, last_fetched_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    
    res.json({ 
      success: true, 
      status: 'CONNECTED',
      responseTimeMs,
      bytesReceived: text.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});"""
content = re.sub(
    r"// POST /api/v1/sources/:id/test - Test HTTP Connection to Source Feed.*?}\);", 
    new_post_sources_test, 
    content, 
    flags=re.DOTALL
)

with open('server/api/newsRouter.ts', 'w') as f:
    f.write(content)
