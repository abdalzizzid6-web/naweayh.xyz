/**
 * Production In-Memory Cache Service with Strict TTL & Eviction Policies.
 * Prevents stale data and bounded memory consumption.
 */
export class CacheService {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private readonly maxEntries: number = 500;

  // Explicit Cache Policies
  public static readonly POLICIES = {
    FEED: 30,           // 30 seconds for live news feeds
    ARTICLE_DETAIL: 60, // 60 seconds for individual articles
    SOURCES: 300,       // 5 minutes for source catalog
    METRICS: 60,        // 1 minute for telemetry and counts
  };

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds: number = CacheService.POLICIES.FEED): void {
    // Evict oldest entry if maximum capacity is reached
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = CacheService.POLICIES.FEED
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fetcher();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  public invalidate(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  public invalidateArticle(slugOrId?: string): void {
    this.invalidate('feed:');
    this.invalidate('latest:');
    this.invalidate('breaking:');
    this.invalidate('trending:');
    if (slugOrId) {
      this.cache.delete(`article:${slugOrId}`);
    }
  }
}

export const cacheService = new CacheService();
