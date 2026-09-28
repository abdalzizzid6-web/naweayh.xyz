import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/connection';
import { extractClientIp } from './SecurityAuditService';

export interface RateLimiterOptions {
  keyPrefix: string;
  maxPoints: number;
  windowSeconds: number;
  message?: string;
  identifier?: (req: Request) => string;
}

/**
 * High-performance distributed Rate Limiter backed by PostgreSQL table `rate_limits`.
 * Supports serverless / distributed multiple instance environments.
 */
export class RateLimiterService {
  /**
   * Consume a point for a given key. Returns remaining points and whether it was allowed.
   */
  public static async consume(
    key: string,
    maxPoints: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
    const now = Math.floor(Date.now() / 1000);
    const resetAt = now + windowSeconds;

    try {
      // Upsert rate limit record atomically in PostgreSQL
      const query = `
        INSERT INTO rate_limits (key, points, reset_at, updated_at)
        VALUES ($1, 1, $2, NOW())
        ON CONFLICT (key) DO UPDATE
        SET points = CASE 
              WHEN rate_limits.reset_at <= $3 THEN 1
              ELSE rate_limits.points + 1
            END,
            reset_at = CASE 
              WHEN rate_limits.reset_at <= $3 THEN $2
              ELSE rate_limits.reset_at
            END,
            updated_at = NOW()
        RETURNING points, reset_at;
      `;

      const result = await pool.query(query, [key, resetAt, now]);
      if (result.rows.length > 0) {
        const currentPoints = result.rows[0].points;
        const currentResetAt = Number(result.rows[0].reset_at);
        const remaining = Math.max(0, maxPoints - currentPoints);
        const resetSeconds = Math.max(1, currentResetAt - now);

        return {
          allowed: currentPoints <= maxPoints,
          remaining,
          resetSeconds,
        };
      }
    } catch (err) {
      // If table is not yet ready or DB error, allow request with warning to prevent DoS
      console.warn('[RateLimiter] Fallback on DB query:', (err as any)?.message);
    }

    return { allowed: true, remaining: maxPoints - 1, resetSeconds: windowSeconds };
  }

  /**
   * Express middleware generator for endpoints.
   */
  public static middleware(options: RateLimiterOptions) {
    const {
      keyPrefix,
      maxPoints,
      windowSeconds,
      message = 'تم تجاوز الحد المسموح به من الطلبات. يرجى الانتظار قليلاً والمحاولة لاحقاً.',
      identifier,
    } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
      const id = identifier ? identifier(req) : extractClientIp(req);
      const key = `${keyPrefix}:${id}`;

      const status = await RateLimiterService.consume(key, maxPoints, windowSeconds);

      res.setHeader('X-RateLimit-Limit', maxPoints);
      res.setHeader('X-RateLimit-Remaining', status.remaining);
      res.setHeader('X-RateLimit-Reset', status.resetSeconds);

      if (!status.allowed) {
        res.setHeader('Retry-After', status.resetSeconds);
        return res.status(429).json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfterSeconds: status.resetSeconds,
        });
      }

      next();
    };
  }

  /**
   * Configurable limits via Environment Variables
   */
  public static getLimits() {
    return {
      loginMax: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5', 10),
      loginWindowSec: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_SEC || '900', 10), // 15 mins
      searchMax: parseInt(process.env.RATE_LIMIT_SEARCH_MAX || '60', 10),
      searchWindowSec: parseInt(process.env.RATE_LIMIT_SEARCH_WINDOW_SEC || '60', 10),
      analyticsMax: parseInt(process.env.RATE_LIMIT_ANALYTICS_MAX || '120', 10),
      viewsMax: parseInt(process.env.RATE_LIMIT_VIEWS_MAX || '60', 10),
      sharesMax: parseInt(process.env.RATE_LIMIT_SHARES_MAX || '30', 10),
      saveMax: parseInt(process.env.RATE_LIMIT_SAVE_MAX || '60', 10),
      aiMax: parseInt(process.env.RATE_LIMIT_AI_MAX || '20', 10),
      ingestMax: parseInt(process.env.RATE_LIMIT_INGEST_MAX || '10', 10),
      adminMax: parseInt(process.env.RATE_LIMIT_ADMIN_MAX || '120', 10),
    };
  }
}
