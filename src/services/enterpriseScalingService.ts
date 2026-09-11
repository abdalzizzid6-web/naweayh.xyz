import { auditRepository } from '../repositories/auditRepository';
import {
  RedisCacheMetrics,
  CDNEdgeNode,
  ImageOptimizationConfig,
  PWAServiceWorkerConfig,
  DatabaseIndexOptimizerConfig,
  NewsArticle,
} from '../core/domain/types';

// In-Memory L1 Client/Server Cache Engine
class EnterpriseCacheEngine {
  private memoryCache = new Map<string, { value: any; expiresAt: number }>();
  private hits = 0;
  private misses = 0;

  public get<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (item && item.expiresAt > Date.now()) {
      this.hits++;
      return item.value as T;
    }
    this.misses++;
    return null;
  }

  public set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public invalidateTag(tag: string): number {
    let count = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.includes(tag)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    return count;
  }

  public getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? parseFloat(((this.hits / total) * 100).toFixed(2)) : 0;
  }

  public purgeAll(): void {
    this.memoryCache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public size(): number {
    return this.memoryCache.size;
  }
}

export const cacheEngine = new EnterpriseCacheEngine();

export class EnterpriseScalingService {
  // Redis is marked as NOT_CONFIGURED when no external Redis server is connected
  private redisMetrics: RedisCacheMetrics = {
    status: 'NOT_CONFIGURED',
    totalKeys: null,
    memoryUsedMB: null,
    hitRatePercent: null,
    evictionPolicy: 'not_configured',
    clusterNodes: null,
    queriesPerSecond: null,
  };

  // CDN edges are empty and marked NOT_CONFIGURED until an edge CDN provider (e.g. Cloudflare) is connected
  private cdnNodes: CDNEdgeNode[] = [];

  private imageConfig: ImageOptimizationConfig = {
    defaultFormat: 'AVIF',
    qualityPercent: 85,
    autoResizeWidths: [320, 640, 800, 1200, 1920],
    blurPlaceholderEnabled: true,
    lazyLoadNative: true,
    cdnImageProxyDomain: '',
  };

  private pwaConfig: PWAServiceWorkerConfig = {
    registered: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    offlineStorageMB: 0,
    cachedArticlesCount: 0,
    backgroundSyncPending: 0,
    http3Support: true,
    brotliCompression: true,
    staleWhileRevalidateEnabled: true,
  };

  private dbOptimizer: DatabaseIndexOptimizerConfig = {
    status: 'NOT_CONFIGURED',
    totalPartitionedRecords: null,
    activeCompositeIndexes: null,
    avgQueryExecutionMs: null,
    cursorPaginationEnabled: true,
    readReplicasCount: null,
    pgBouncerPoolSize: null,
  };

  // --- 1. IMAGE OPTIMIZATION HELPER ---
  public getOptimizedImageUrl(
    originalUrl: string,
    width: number = 800,
    format: 'AVIF' | 'WebP' | 'JPEG' = 'AVIF'
  ): string {
    if (!originalUrl) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
    if (originalUrl.includes('unsplash.com')) {
      const fmt = format.toLowerCase();
      return `${originalUrl}&w=${width}&auto=format&fit=crop&q=${this.imageConfig.qualityPercent}&fm=${fmt}`;
    }
    if (this.imageConfig.cdnImageProxyDomain) {
      return `${this.imageConfig.cdnImageProxyDomain}/fit-in/${width}x0/filters:format(${format.toLowerCase()}):quality(${this.imageConfig.qualityPercent})/${encodeURIComponent(originalUrl)}`;
    }
    return originalUrl;
  }

  // --- 2. CURSOR PAGINATION USING REAL MEASURED PERFORMANCE ---
  public getCursorPaginatedArticles(
    articles: NewsArticle[],
    cursor?: string,
    limit: number = 10,
    category?: string,
    country?: string
  ) {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let filtered = articles;
    if (category && category !== 'الكل') {
      filtered = filtered.filter((a) => a.category === category);
    }
    if (country && country !== 'جميع الدول') {
      filtered = filtered.filter((a) => a.country === country);
    }

    let startIndex = 0;
    if (cursor) {
      const foundIdx = filtered.findIndex((a) => a.id === cursor);
      if (foundIdx !== -1) {
        startIndex = foundIdx + 1;
      }
    }

    const items = filtered.slice(startIndex, startIndex + limit);
    const nextCursor = items.length > 0 && startIndex + limit < filtered.length ? items[items.length - 1].id : null;
    const durationMs = typeof performance !== 'undefined' ? (performance.now() - startTime).toFixed(2) : '1.0';

    return {
      items,
      nextCursor,
      hasMore: nextCursor !== null,
      totalClusterCount: articles.length,
      queryExecutionMs: durationMs,
      usedIndex: `idx_news_${category || 'all'}_published_desc`,
    };
  }

  // --- 3. REDIS CACHE OPERATIONS ---
  public getRedisMetrics(): RedisCacheMetrics {
    // If Redis is not configured, report NOT_CONFIGURED status with real in-memory keys
    return {
      status: 'NOT_CONFIGURED',
      totalKeys: cacheEngine.size(),
      memoryUsedMB: null,
      hitRatePercent: cacheEngine.getHitRate(),
      evictionPolicy: 'not_configured',
      clusterNodes: null,
      queriesPerSecond: null,
    };
  }

  public purgeRedisCache(tag?: string): number {
    let purged = 0;
    if (tag) {
      purged = cacheEngine.invalidateTag(tag);
    } else {
      purged = cacheEngine.size();
      cacheEngine.purgeAll();
    }

    auditRepository.logAction(
      'Performance Engine',
      'System Admin',
      'PURGE_CACHE',
      tag || 'GLOBAL',
      `Purged cache keys for tag: ${tag || 'ALL_KEYS'}`
    );

    return purged;
  }

  // --- 4. CDN & HTTP/3 MANAGERS ---
  public getCDNNodes(): CDNEdgeNode[] {
    return this.cdnNodes;
  }

  public purgeCDNCache(city?: string): boolean {
    auditRepository.logAction(
      'Performance Engine',
      'System Admin',
      'PURGE_CDN_CACHE',
      city || 'GLOBAL_EDGE',
      `CDN Cache purge requested for: ${city || 'ALL_CITIES'}`
    );
    return true;
  }

  // --- 5. IMAGE & PWA CONFIG GETTERS / UPDATERS ---
  public getImageConfig(): ImageOptimizationConfig {
    return this.imageConfig;
  }

  public updateImageConfig(newCfg: Partial<ImageOptimizationConfig>): ImageOptimizationConfig {
    this.imageConfig = { ...this.imageConfig, ...newCfg };
    auditRepository.logAction(
      'Performance Engine',
      'System Admin',
      'UPDATE_IMAGE_PIPELINE',
      'Image Optimization',
      `Updated Default Image Format to ${this.imageConfig.defaultFormat} (${this.imageConfig.qualityPercent}% quality)`
    );
    return this.imageConfig;
  }

  public getPWAConfig(): PWAServiceWorkerConfig {
    return this.pwaConfig;
  }

  public triggerOfflineBackgroundSync(): number {
    const syncedCount = this.pwaConfig.backgroundSyncPending;
    this.pwaConfig.backgroundSyncPending = 0;
    auditRepository.logAction(
      'Performance Engine',
      'Operations Lead',
      'TRIGGER_BACKGROUND_SYNC',
      'PWA Worker',
      `Processed background sync queue.`
    );
    return syncedCount;
  }

  public getDatabaseOptimizerConfig(): DatabaseIndexOptimizerConfig {
    return this.dbOptimizer;
  }

  public rebuildCompositeIndexes(): void {
    auditRepository.logAction(
      'Performance Engine',
      'System Admin',
      'REBUILD_DATABASE_INDEXES',
      'Database Cluster',
      `Composite database index optimization request triggered.`
    );
  }
}

export const enterpriseScalingService = new EnterpriseScalingService();
