import { pool } from '../db/connection';

export interface ArticleInput {
  id: number;
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  country?: string;
  sourceId: number;
  publishedAt: string;
}

export class StoryClusteringService {
  /**
   * Tokenize text for Jaccard and keyword matching (Arabic and English support)
   */
  private tokenize(text: string): Set<string> {
    if (!text) return new Set();
    const clean = text
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
      .replace(/\s+/g, ' ');
    const stopWords = new Set(['في', 'من', 'على', 'عن', 'إلى', 'أن', 'التي', 'الذي', 'و', 'أو', 'هذا', 'هذه', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for']);
    const tokens = clean.split(' ').filter(t => t.length > 2 && !stopWords.has(t));
    return new Set(tokens);
  }

  private computeJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 || set2.size === 0) return 0;
    let intersection = 0;
    for (const item of set1) {
      if (set2.has(item)) intersection++;
    }
    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Process article for story clustering
   */
  public async processArticleForClustering(article: ArticleInput): Promise<number | null> {
    try {
      const articleTokens = this.tokenize(article.title + ' ' + (article.summary || ''));
      
      // Candidate generation: active clusters in same category or country published within last 72 hours
      const candidateRes = await pool.query(
        `SELECT id, title, summary, category, country, first_published_at, last_updated_at, articles_count
         FROM story_clusters
         WHERE status = 'ACTIVE'
           AND (category = $1 OR country = $2 OR first_published_at >= NOW() - INTERVAL '72 hours')
         ORDER BY last_updated_at DESC
         LIMIT 50`,
        [article.category || 'أخبار عامة', article.country || 'اليمن']
      );

      let bestClusterId: number | null = null;
      let maxScore = 0;

      for (const cluster of candidateRes.rows) {
        const clusterTokens = this.tokenize(cluster.title + ' ' + (cluster.summary || ''));
        const titleSim = this.computeJaccardSimilarity(articleTokens, clusterTokens);

        const categoryMatch = article.category && cluster.category && article.category.trim() === cluster.category.trim() ? 1 : 0;
        const countryMatch = article.country && cluster.country && article.country.trim() === cluster.country.trim() ? 1 : 0;

        // Time proximity score (decay over 48 hours)
        const clusterTime = new Date(cluster.last_updated_at).getTime();
        const articleTime = new Date(article.publishedAt).getTime();
        const hoursDiff = Math.abs(articleTime - clusterTime) / (1000 * 60 * 60);
        const timeScore = Math.max(0, 1 - (hoursDiff / 48));

        // Combined Similarity Score
        const score = (titleSim * 0.45) + (categoryMatch * 0.20) + (countryMatch * 0.15) + (timeScore * 0.20);

        if (score > maxScore) {
          maxScore = score;
          bestClusterId = cluster.id;
        }
      }

      // Threshold HIGH (>= 0.55): Assign to existing cluster
      if (bestClusterId && maxScore >= 0.55) {
        await this.assignArticleToCluster(article.id, bestClusterId);
        return bestClusterId;
      } else {
        // Create new cluster
        const newClusterId = await this.createNewCluster(article);
        return newClusterId;
      }
    } catch (err) {
      console.error('[StoryClusteringService] Error clustering article:', err);
      return null;
    }
  }

  public async assignArticleToCluster(articleId: number, clusterId: number): Promise<void> {
    await pool.query(
      `UPDATE news_articles SET story_cluster_id = $1 WHERE id = $2`,
      [clusterId, articleId]
    );

    // Update cluster metadata (articles_count, sources_count, last_updated_at)
    const statsRes = await pool.query(
      `SELECT COUNT(*) as count, COUNT(DISTINCT source_id) as sources_count
       FROM news_articles WHERE story_cluster_id = $1`,
      [clusterId]
    );
    const count = parseInt(statsRes.rows[0].count, 10) || 1;
    const sourcesCount = parseInt(statsRes.rows[0].sources_count, 10) || 1;

    await pool.query(
      `UPDATE story_clusters 
       SET articles_count = $1::integer, sources_count = $2::integer, last_updated_at = CURRENT_TIMESTAMP,
           importance_score = LEAST(100.0, importance_score + ($1::numeric * 2.5))
       WHERE id = $3`,
      [count, sourcesCount, clusterId]
    );
  }

  public async createNewCluster(article: ArticleInput): Promise<number> {
    const slug =
      article.title
        .replace(/[\s\u0600-\u06FF]+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .toLowerCase()
        .slice(0, 70) +
      '-' +
      Math.random().toString(36).substring(2, 7);

    const insertRes = await pool.query(
      `INSERT INTO story_clusters (
         slug, title, summary, category, country, first_published_at, last_updated_at, articles_count, sources_count
       ) VALUES ($1, $2, $3, $4, $5, $6, $6, 1, 1)
       RETURNING id`,
      [
        slug,
        article.title,
        article.summary || article.title,
        article.category || 'أخبار عامة',
        article.country || 'اليمن',
        article.publishedAt || new Date().toISOString(),
      ]
    );

    const clusterId = insertRes.rows[0].id;
    await pool.query(
      `UPDATE news_articles SET story_cluster_id = $1 WHERE id = $2`,
      [clusterId, article.id]
    );

    return clusterId;
  }

  public async mergeClusters(sourceClusterId: number, targetClusterId: number): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE news_articles SET story_cluster_id = $1 WHERE story_cluster_id = $2`,
        [targetClusterId, sourceClusterId]
      );
      await pool.query(`DELETE FROM story_clusters WHERE id = $1`, [sourceClusterId]);
      
      // Recalculate stats for target cluster
      const statsRes = await pool.query(
        `SELECT COUNT(*) as count, COUNT(DISTINCT source_id) as sources_count
         FROM news_articles WHERE story_cluster_id = $1`,
        [targetClusterId]
      );
      const count = parseInt(statsRes.rows[0].count, 10) || 1;
      const sourcesCount = parseInt(statsRes.rows[0].sources_count, 10) || 1;

      await pool.query(
        `UPDATE story_clusters SET articles_count = $1, sources_count = $2, last_updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [count, sourcesCount, targetClusterId]
      );

      return true;
    } catch (e) {
      console.error('Merge clusters error:', e);
      return false;
    }
  }

  public async splitArticle(articleId: number): Promise<number | null> {
    try {
      // Remove from current cluster and create new single-article cluster
      const artRes = await pool.query(`SELECT * FROM news_articles WHERE id = $1`, [articleId]);
      if (artRes.rowCount === 0) return null;
      const article = artRes.rows[0];

      const newClusterId = await this.createNewCluster({
        id: article.id,
        title: article.title,
        summary: article.summary,
        category: article.category,
        country: article.country,
        sourceId: article.source_id,
        publishedAt: article.published_at,
      });

      return newClusterId;
    } catch (e) {
      console.error('Split article error:', e);
      return null;
    }
  }
}

export const storyClusteringService = new StoryClusteringService();
