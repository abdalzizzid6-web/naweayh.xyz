import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/connection';

interface RequestSample {
  timestamp: number;
  durationMs: number;
  statusCode: number;
  route: string;
}

export interface EndpointMetric {
  path: string;
  method: string;
  rpm: number;
  latencyMs: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'DOWN';
  statusCodes: { [code: string]: number };
}

export interface SystemHealthMetrics {
  server: {
    status: 'ONLINE' | 'DEGRADED';
    uptimeSeconds: number;
    memoryUsedMB: number;
    memoryTotalMB: number;
    cpuLoadPercent: number;
    activeRequests: number;
    requestsPerMinute: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
  };
  statusCodes: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
    total: number;
  };
  endpoints: EndpointMetric[];
  services: {
    database: {
      status: 'REAL' | 'UNAVAILABLE' | 'ERROR';
      type: 'PostgreSQL';
      latencyMs: number | null;
      activeConnections: number | null;
      articlesCount: number | null;
      sourcesCount: number | null;
    };
    aiEngine: {
      status: 'REAL' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
      provider: string;
      model: string;
      apiKeyConfigured: boolean;
      jobsCompletedToday: number;
      jobsFailedToday: number;
    };
    redis: {
      status: 'NOT_CONFIGURED';
      message: 'Redis cache provider is not configured in this environment.';
      keysCount: null;
      memoryMB: null;
      hitRatePercent: null;
    };
    cdn: {
      status: 'NOT_CONFIGURED';
      message: 'CDN edge delivery provider is not configured.';
      edgeLocations: [];
      bandwidthGB: null;
      cacheHitPercent: null;
    };
    pushNotifications: {
      status: 'NOT_CONFIGURED';
      message: 'FCM / WebPush credentials are not configured.';
      activeSubscribers: null;
    };
  };
}

class TelemetryService {
  private samples: RequestSample[] = [];
  private activeRequestsCount = 0;
  private maxSamples = 2000;
  private endpointCounters: Map<string, { count: number; totalDurationMs: number; codes: { [c: string]: number } }> = new Map();
  private statusCodesTotal = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, total: 0 };

  /**
   * Express middleware to capture real HTTP metrics
   */
  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Don't clutter with static assets
      if (req.path.startsWith('/@') || req.path.startsWith('/src') || req.path.includes('.')) {
        return next();
      }

      this.activeRequestsCount++;
      const startTime = Date.now();

      res.on('finish', () => {
        this.activeRequestsCount = Math.max(0, this.activeRequestsCount - 1);
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Group route
        const normalizedRoute = req.baseUrl + (req.route?.path || req.path || '/');

        // Record status code
        if (statusCode >= 200 && statusCode < 300) this.statusCodesTotal['2xx']++;
        else if (statusCode >= 300 && statusCode < 400) this.statusCodesTotal['3xx']++;
        else if (statusCode >= 400 && statusCode < 500) this.statusCodesTotal['4xx']++;
        else if (statusCode >= 500) this.statusCodesTotal['5xx']++;
        this.statusCodesTotal.total++;

        // Record endpoint counter
        const epKey = `${req.method} ${normalizedRoute}`;
        const epData = this.endpointCounters.get(epKey) || { count: 0, totalDurationMs: 0, codes: {} };
        epData.count++;
        epData.totalDurationMs += duration;
        epData.codes[statusCode] = (epData.codes[statusCode] || 0) + 1;
        this.endpointCounters.set(epKey, epData);

        // Record sample
        this.samples.push({
          timestamp: Date.now(),
          durationMs: duration,
          statusCode,
          route: epKey,
        });

        if (this.samples.length > this.maxSamples) {
          this.samples.shift();
        }
      });

      next();
    };
  }

  /**
   * Calculates live, real system metrics from measured data
   */
  public async getLiveMetrics(): Promise<SystemHealthMetrics> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Prune samples older than 10 minutes
    this.samples = this.samples.filter(s => s.timestamp > now - 600000);

    const recentMinuteSamples = this.samples.filter(s => s.timestamp >= oneMinuteAgo);
    const rpm = recentMinuteSamples.length;

    const latencies = recentMinuteSamples.map(s => s.durationMs).sort((a, b) => a - b);
    const avgLatency = latencies.length > 0 
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) 
      : 0;
    const p95Latency = latencies.length > 0 
      ? latencies[Math.floor(latencies.length * 0.95)] 
      : 0;

    // Memory info
    const mem = process.memoryUsage();
    const memoryUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(mem.heapTotal / 1024 / 1024);

    // Real Database probe
    let dbLatencyMs: number | null = null;
    let dbStatus: 'REAL' | 'UNAVAILABLE' | 'ERROR' = 'UNAVAILABLE';
    let articlesCount: number | null = null;
    let sourcesCount: number | null = null;

    try {
      const dbStart = Date.now();
      await pool.query('SELECT 1');
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = 'REAL';

      const artRes = await pool.query('SELECT COUNT(*) as count FROM news_articles');
      articlesCount = parseInt(artRes.rows[0]?.count || '0', 10);

      const srcRes = await pool.query('SELECT COUNT(*) as count FROM news_sources');
      sourcesCount = parseInt(srcRes.rows[0]?.count || '0', 10);
    } catch (err: any) {
      dbStatus = 'ERROR';
    }

    // Real AI Jobs count today
    let aiJobsCompleted = 0;
    let aiJobsFailed = 0;
    try {
      const aiRes = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
          COUNT(*) FILTER (WHERE status = 'FAILED') as failed
         FROM ai_jobs
         WHERE created_at >= CURRENT_DATE`
      );
      aiJobsCompleted = parseInt(aiRes.rows[0]?.completed || '0', 10);
      aiJobsFailed = parseInt(aiRes.rows[0]?.failed || '0', 10);
    } catch {
      // Ignore if table missing
    }

    // Top active endpoints
    const endpoints: EndpointMetric[] = [];
    this.endpointCounters.forEach((val, key) => {
      const [method, ...pathParts] = key.split(' ');
      const path = pathParts.join(' ');
      const epAvg = val.count > 0 ? Math.round(val.totalDurationMs / val.count) : 0;
      endpoints.push({
        path,
        method,
        rpm: Math.round(val.count / Math.max(1, process.uptime() / 60)),
        latencyMs: epAvg,
        status: epAvg < 200 ? 'OPTIMAL' : epAvg < 500 ? 'DEGRADED' : 'DOWN',
        statusCodes: val.codes,
      });
    });

    return {
      server: {
        status: 'ONLINE',
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsedMB,
        memoryTotalMB,
        cpuLoadPercent: 0,
        activeRequests: this.activeRequestsCount,
        requestsPerMinute: rpm,
        avgLatencyMs: avgLatency,
        p95LatencyMs: p95Latency,
      },
      statusCodes: { ...this.statusCodesTotal },
      endpoints: endpoints.slice(0, 10),
      services: {
        database: {
          status: dbStatus,
          type: 'PostgreSQL',
          latencyMs: dbLatencyMs,
          activeConnections: (pool as any).totalCount || 1,
          articlesCount,
          sourcesCount,
        },
        aiEngine: {
          status: process.env.GEMINI_API_KEY ? 'REAL' : 'NOT_CONFIGURED',
          provider: 'Google Gemini AI',
          model: 'gemini-3.6-flash',
          apiKeyConfigured: !!process.env.GEMINI_API_KEY,
          jobsCompletedToday: aiJobsCompleted,
          jobsFailedToday: aiJobsFailed,
        },
        redis: {
          status: 'NOT_CONFIGURED',
          message: 'Redis cache provider is not configured in this environment.',
          keysCount: null,
          memoryMB: null,
          hitRatePercent: null,
        },
        cdn: {
          status: 'NOT_CONFIGURED',
          message: 'CDN edge delivery provider is not configured.',
          edgeLocations: [],
          bandwidthGB: null,
          cacheHitPercent: null,
        },
        pushNotifications: {
          status: 'NOT_CONFIGURED',
          message: 'FCM / WebPush credentials are not configured.',
          activeSubscribers: null,
        },
      },
    };
  }
}

export const telemetryService = new TelemetryService();
