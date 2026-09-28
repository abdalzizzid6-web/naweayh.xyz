import { Request } from 'express';
import { pool } from '../db/connection';

export type SecurityEventType =
  | 'login'
  | 'logout'
  | 'password_change'
  | 'admin_action'
  | 'social_connection'
  | 'social_publishing'
  | 'api_key_change'
  | 'settings_change'
  | 'access_denied';

export interface AuditLogEntry {
  eventType: SecurityEventType;
  userId?: number | null;
  userEmail?: string | null;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource?: string;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  details?: Record<string, any>;
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown-ip';
}

export const SecurityAuditService = {
  /**
   * Logs a security audit event into the PostgreSQL database.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Redact sensitive keys in details if present
      const cleanDetails = entry.details ? { ...entry.details } : {};
      for (const k of Object.keys(cleanDetails)) {
        if (/password|secret|token|authorization|cookie/i.test(k)) {
          cleanDetails[k] = '[REDACTED]';
        }
      }

      await pool.query(
        `INSERT INTO security_audit_logs 
         (event_type, user_id, user_email, ip_address, user_agent, action, resource, status, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          entry.eventType,
          entry.userId || null,
          entry.userEmail || null,
          entry.ipAddress || 'unknown-ip',
          (entry.userAgent || '').slice(0, 500),
          entry.action,
          entry.resource || null,
          entry.status,
          JSON.stringify(cleanDetails),
        ]
      );
    } catch (err) {
      // Don't crash request if audit log write fails, but output to stderr
      console.error('[SecurityAudit] Failed to persist audit log:', err);
    }
  },

  /**
   * Helper to log an event from an Express Request context.
   */
  async logFromRequest(
    req: Request,
    eventType: SecurityEventType,
    action: string,
    status: 'SUCCESS' | 'FAILURE' | 'BLOCKED',
    extra: {
      resource?: string;
      details?: Record<string, any>;
      userId?: number;
      userEmail?: string;
    } = {}
  ): Promise<void> {
    const user = (req as any).user;
    const userId = extra.userId || user?.userId || null;
    const userEmail = extra.userEmail || user?.email || null;
    const ipAddress = extractClientIp(req);
    const userAgent = (req.headers['user-agent'] as string) || '';

    await SecurityAuditService.log({
      eventType,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      action,
      resource: extra.resource,
      status,
      details: extra.details,
    });
  },

  /**
   * Fetch recent security audit logs (Admin only).
   */
  async getRecentLogs(limit: number = 50, offset: number = 0) {
    const res = await pool.query(
      `SELECT * FROM security_audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [Math.min(limit, 200), offset]
    );
    return res.rows;
  }
};
