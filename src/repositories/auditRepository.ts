import { BaseRepository, PaginationOptions, PaginatedResult } from './baseRepository';
import { AuditLog, UserRole } from '../types';

const INITIAL_AUDITS: AuditLog[] = [
  {
    id: 'aud-901',
    timestamp: '2026-08-06 22:45:12',
    userId: 'u-101',
    userName: 'Alexander Safara',
    userRole: 'Executive',
    action: 'APPROVED_SPRINT_RELEASE',
    entity: 'Sprint-90-Master',
    details: 'Verified ESLint, TypeScript, and Build requirements before executive release.',
    ipAddress: '192.168.1.104',
    status: 'Success',
  },
  {
    id: 'aud-902',
    timestamp: '2026-08-06 21:30:05',
    userId: 'u-102',
    userName: 'Elena Rostova',
    userRole: 'Operations Lead',
    action: 'UPDATED_PROJECT_BUDGET',
    entity: 'SAF-NOE-01',
    details: 'Allocated additional $50,000 budget for neural training data cluster.',
    ipAddress: '192.168.1.112',
    status: 'Success',
  },
  {
    id: 'aud-903',
    timestamp: '2026-08-06 20:15:40',
    userId: 'u-103',
    userName: 'Marcus Vance',
    userRole: 'System Admin',
    action: 'ROTATED_API_CREDENTIALS',
    entity: 'Zero-Trust Gateway',
    details: 'Automated 30-day token rotation protocol invoked successfully.',
    ipAddress: '10.0.0.15',
    status: 'Success',
  },
  {
    id: 'aud-904',
    timestamp: '2026-08-06 18:00:22',
    userId: 'u-104',
    userName: 'Sarah Jenkins',
    userRole: 'Auditor',
    action: 'EXPORTED_COMPLIANCE_REPORT',
    entity: 'Global Audit Logs',
    details: 'Exported quarterly compliance logs for ISO 27001 verification.',
    ipAddress: '192.168.2.45',
    status: 'Success',
  },
  {
    id: 'aud-905',
    timestamp: '2026-08-06 15:10:01',
    userId: 'u-900',
    userName: 'Unrecognized Session',
    userRole: 'Auditor',
    action: 'FAILED_ROLE_ELEVATION',
    entity: 'Admin Panel',
    details: 'Attempted to access System Admin settings without multi-factor authorization token.',
    ipAddress: '203.0.113.195',
    status: 'Failed',
  },
];

export class AuditRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('safara90_audit_v1');
    this.seedIfEmpty();
  }

  private seedIfEmpty(): void {
    if (this.getStoredItems().length === 0) {
      this.setStoredItems(INITIAL_AUDITS);
    }
  }

  public getFilteredLogs(
    roleFilter?: UserRole | 'All',
    statusFilter?: 'Success' | 'Warning' | 'Failed' | 'All',
    searchQuery?: string,
    options?: PaginationOptions
  ): PaginatedResult<AuditLog> {
    let logs = this.getStoredItems();

    if (roleFilter && roleFilter !== 'All') {
      logs = logs.filter((l) => l.userRole === roleFilter);
    }

    if (statusFilter && statusFilter !== 'All') {
      logs = logs.filter((l) => l.status === statusFilter);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      );
    }

    if (!options) {
      return {
        data: logs,
        total: logs.length,
        page: 1,
        totalPages: 1,
      };
    }

    const limit = Math.max(1, options.limit);
    const page = Math.max(1, options.page);
    const start = (page - 1) * limit;
    const paginatedData = logs.slice(start, start + limit);
    const totalPages = Math.ceil(logs.length / limit) || 1;

    return {
      data: paginatedData,
      total: logs.length,
      page,
      totalPages,
    };
  }

  public logAction(
    userName: string,
    userRole: UserRole,
    action: string,
    entity: string,
    details: string,
    status: 'Success' | 'Warning' | 'Failed' = 'Success'
  ): AuditLog {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: formattedDate,
      userId: `u-${Math.floor(Math.random() * 900 + 100)}`,
      userName,
      userRole,
      action,
      entity,
      details,
      ipAddress: '127.0.0.1',
      status,
    };
    return this.add(log);
  }
}

export const auditRepository = new AuditRepository();
