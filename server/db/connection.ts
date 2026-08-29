import { Pool } from 'pg';
import dotenv from 'dotenv';
import { PGlite } from '@electric-sql/pglite';
import { ENTERPRISE_SOURCE_CATALOG } from './enterpriseSourcesSeed';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

// We use a custom pool interface to support both real pg Pool and PGlite
export interface IDatabasePool {
  query(text: string, params?: any[]): Promise<any>;
  connect(): Promise<any>;
}

let pool: IDatabasePool;
let isPglite = false;

const isServerless = !!process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

if (connectionString) {
  const pgPool = new Pool({
    connectionString,
    ssl: (process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') || connectionString.includes('supabase.co')) ? { rejectUnauthorized: false } : false,
    max: isServerless ? 3 : 10,
    idleTimeoutMillis: isServerless ? 5000 : 30000,
    connectionTimeoutMillis: 5000,
  });
  
  pool = {
    query: (text, params) => pgPool.query(text, params),
    connect: async () => pgPool.connect(),
  };
} else {
  if (process.env.NODE_ENV === 'production' && !isServerless) {
    console.warn('WARNING: DATABASE_URL is not set in production. Using PGlite in-memory fallback.');
  }
  console.log('Using PGlite (Local PostgreSQL) since DATABASE_URL is missing (Development/Test/Fallback Mode).');
  isPglite = true;
  const pglite = new PGlite();
  
  pool = {
    query: async (text, params) => {
      await pglite.waitReady;
      const result = await pglite.query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rows ? result.rows.length : 0,
      };
    },
    connect: async () => {
      await pglite.waitReady;
      return {
        query: async (text: string, params?: any[]) => {
          await pglite.waitReady;
          const result = await pglite.query(text, params);
          return { rows: result.rows, rowCount: result.rows ? result.rows.length : 0 };
        },
        release: () => {},
      };
    },
  };
}

export { pool };

export async function testDbConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    console.log('PostgreSQL Database Connected Successfully:', res.rows[0].now);
    await initDb();
    return true;
  } catch (error) {
    console.error('CRITICAL: PostgreSQL connection failed:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return false;
  }
}

export async function initDb() {
  try {
    console.log('Initializing Database Schema...');
    const statements = dbSchemaDefinition.split(';').filter(s => s.trim().length > 0);
    for (const stmt of statements) {
      try {
        await pool.query(stmt + ';');
      } catch (e: any) {
        // Ignore column already exists or table exists errors during incremental schema updates
        if (!e.message?.includes('already exists')) {
          console.warn('Schema statement notice:', e.message);
        }
      }
    }
    console.log('Database Schema Initialization Complete.');
    
    // Ensure Phase 3.6 columns exist on news_articles and news_sources
    const alterCols = [
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS subheadline VARCHAR(500);`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS content_html TEXT;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS content_text TEXT;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS excerpt TEXT;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS content_status VARCHAR(50) DEFAULT 'partial';`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS content_source VARCHAR(50) DEFAULT 'rss';`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS content_classification VARCHAR(50) DEFAULT 'FEED_CONTENT';`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS content_origin VARCHAR(50) DEFAULT 'FULL_FEED';`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS content_quality_score INT DEFAULT 80;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS word_count INT DEFAULT 0;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS paragraph_count INT DEFAULT 0;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS shares_count INT DEFAULT 0;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS saves_count INT DEFAULT 0;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS reading_time_minutes INT DEFAULT 2;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;`,

      // Sources Phase 3.6 columns
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(50);`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP;`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP;`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS health_score INT DEFAULT 100;`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS status_classification VARCHAR(20) DEFAULT 'EXCELLENT';`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS requests_per_minute INT DEFAULT 10;`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS requests_per_hour INT DEFAULT 100;`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS cooldown_until TIMESTAMP;`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS concurrency_limit INT DEFAULT 2;`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS canonical_url VARCHAR(255);`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS average_latency_ms INT DEFAULT 0;`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS articles_per_fetch_avg DECIMAL(5,2) DEFAULT 0;`,
      `ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS freshness_score INT DEFAULT 100;`,

      // Indexes for Cursor Pagination & Search Performance
      `CREATE INDEX IF NOT EXISTS idx_articles_canonical_url ON news_articles(canonical_url);`,
      `CREATE INDEX IF NOT EXISTS idx_articles_source_id ON news_articles(source_id);`,
      `CREATE INDEX IF NOT EXISTS idx_articles_published_at ON news_articles(published_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_articles_created_at ON news_articles(created_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_articles_category ON news_articles(category);`,
      `CREATE INDEX IF NOT EXISTS idx_articles_country ON news_articles(country);`,
      `CREATE INDEX IF NOT EXISTS idx_articles_story_cluster_id ON news_articles(story_cluster_id);`,
      `CREATE INDEX IF NOT EXISTS idx_articles_slug ON news_articles(slug);`,
      `CREATE INDEX IF NOT EXISTS idx_sources_enabled_retry ON news_sources(enabled, next_retry_at);`,
      `CREATE INDEX IF NOT EXISTS idx_sources_country ON news_sources(country);`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_name_unique ON news_sources(name);`
    ];
    for (const alterStmt of alterCols) {
      try { await pool.query(alterStmt); } catch {}
    }
    
    // Seed/sync enterprise sources catalog
    console.log('Syncing Enterprise News Sources Catalog...');
    for (const src of ENTERPRISE_SOURCE_CATALOG) {
      await pool.query(
        `INSERT INTO news_sources (
          name, name_arabic, url, feed_url, logo, country, language, category, type, enabled, priority, trust_score, fetch_interval
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (name) DO UPDATE SET
          feed_url = EXCLUDED.feed_url,
          url = EXCLUDED.url,
          country = EXCLUDED.country,
          category = EXCLUDED.category`,
        [
          src.name,
          src.nameArabic,
          src.url,
          src.feedUrl,
          src.logo,
          src.country,
          src.language,
          src.category,
          src.type,
          src.enabled,
          src.priority,
          src.trustScore,
          src.fetchInterval,
        ]
      );
    }
    console.log(`Synced ${ENTERPRISE_SOURCE_CATALOG.length} enterprise news sources into database.`);
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
  }
}

export const dbSchemaDefinition = `
-- PostgreSQL Production Schema for Naw3iya News Enterprise Platform

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  currency VARCHAR(10) DEFAULT 'YER'
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  default_country_id INT REFERENCES countries(id),
  default_language VARCHAR(10) DEFAULT 'ar',
  theme VARCHAR(20) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  name_arabic VARCHAR(150) NOT NULL,
  url VARCHAR(255) NOT NULL,
  feed_url VARCHAR(255) NOT NULL,
  logo VARCHAR(255),
  country VARCHAR(100) DEFAULT 'اليمن',
  language VARCHAR(10) DEFAULT 'ar',
  category VARCHAR(100) DEFAULT 'أخبار عامة',
  type VARCHAR(50) DEFAULT 'RSS',
  enabled BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 1,
  trust_score INT DEFAULT 90,
  fetch_interval INT DEFAULT 300,
  last_fetched_at TIMESTAMP,
  last_success_at TIMESTAMP,
  last_error_at TIMESTAMP,
  last_error TEXT,
  response_time_ms INT DEFAULT 0,
  articles_fetched INT DEFAULT 0,
  articles_inserted INT DEFAULT 0,
  articles_duplicate INT DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS story_clusters (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(600) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  category VARCHAR(100),
  country VARCHAR(100) DEFAULT 'اليمن',
  importance_score DECIMAL(5,2) DEFAULT 50.00,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  first_published_at TIMESTAMP NOT NULL,
  last_updated_at TIMESTAMP NOT NULL,
  articles_count INT DEFAULT 1,
  sources_count INT DEFAULT 1,
  views_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  subheadline VARCHAR(500),
  slug VARCHAR(600) UNIQUE NOT NULL,
  summary TEXT,
  content TEXT,
  formatted_body TEXT,
  cover_image_url VARCHAR(500),
  author VARCHAR(150),
  source_id INT REFERENCES news_sources(id),
  story_cluster_id INT REFERENCES story_clusters(id) ON DELETE SET NULL,
  category VARCHAR(100),
  country VARCHAR(100) DEFAULT 'اليمن',
  language VARCHAR(10) DEFAULT 'ar',
  original_article_url VARCHAR(500),
  canonical_url VARCHAR(500),
  content_classification VARCHAR(50) DEFAULT 'FEED_CONTENT',
  is_full_content_available BOOLEAN DEFAULT FALSE,
  trust_score INT DEFAULT 95,
  sentiment VARCHAR(50) DEFAULT 'Neutral',
  views_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,
  reading_time_minutes INT DEFAULT 2,
  is_breaking BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_media (
  id SERIAL PRIMARY KEY,
  article_id INT REFERENCES news_articles(id) ON DELETE CASCADE,
  media_type VARCHAR(50) DEFAULT 'image',
  url VARCHAR(500) NOT NULL,
  width INT,
  height INT,
  mime_type VARCHAR(100),
  alt_text VARCHAR(255),
  caption TEXT,
  copyright VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS duplicate_groups (
  id SERIAL PRIMARY KEY,
  primary_article_id INT REFERENCES news_articles(id),
  similarity_score DECIMAL(5,4),
  group_hash VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id SERIAL PRIMARY KEY,
  article_id INT REFERENCES news_articles(id) ON DELETE CASCADE,
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  last_error TEXT,
  payload JSONB,
  result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  next_retry_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
