import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath('server/api/newsRouter.ts');

const statements = sourceFile.getStatements();
for (const stmt of statements) {
  if (stmt.getKind() === SyntaxKind.ExpressionStatement) {
    const text = stmt.getText();
    if (text.startsWith("newsApiRouter.get('/cron/fetch-news'")) {
      stmt.replaceWithText(`newsApiRouter.get('/cron/fetch-news', async (_req, res) => {
  try {
    const dbRes = await pool.query("SELECT * FROM news_sources WHERE enabled = true AND status = 'Active'");
    const activeSources = dbRes.rows;
    let fetchedCount = 0;
    
    for (const source of activeSources.slice(0, 5)) {
      const log = await newsIngestionService.fetchAndIngestSource({
        id: source.id,
        name: source.name,
        nameArabic: source.name_arabic,
        url: source.url,
        feedUrl: source.feed_url || source.url,
        logo: source.logo,
        country: source.country,
        language: source.language,
        category: source.category,
        type: source.type,
        enabled: source.enabled,
        priority: source.priority,
        trustScore: source.trust_score,
        fetchInterval: source.fetch_interval || 15,
      });
      if (log.newArticlesCount > 0) fetchedCount += log.newArticlesCount;
    }
    res.json({ success: true, message: 'Vercel Cron: Ingestion finished', newArticlesCount: fetchedCount });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});`);
    }
  }
}
sourceFile.saveSync();
