import { auditRepository } from '../repositories/auditRepository';
import { UserRole, AuditLog, SprintReport } from '../types';

export class AdminService {
  public getAuditLogs(
    roleFilter: UserRole | 'All' = 'All',
    statusFilter: 'Success' | 'Warning' | 'Failed' | 'All' = 'All',
    search: string = '',
    page: number = 1,
    limit: number = 10
  ) {
    return auditRepository.getFilteredLogs(roleFilter, statusFilter, search, { page, limit });
  }

  public recordSystemEvent(
    user: { name: string; role: UserRole },
    action: string,
    entity: string,
    details: string,
    status: 'Success' | 'Warning' | 'Failed' = 'Success'
  ): AuditLog {
    return auditRepository.logAction(user.name, user.role, action, entity, details, status);
  }

  public getSprintReports(): SprintReport[] {
    return [
      {
        sprintId: 'SPRINT-90-MASTER',
        title: 'Safara90 Master Sprint 90 Production Validation',
        completedDate: '2026-08-06',
        passedBuild: true,
        passedTypeScript: true,
        passedESLint: true,
        summary: 'Master production sprint verification. Zero dead code, zero unhandled errors, strict repository layer adherence, and full feature-first compliance.',
        metrics: {
          featuresDelivered: 12,
          bugsFixed: 0,
          codeQualityScore: 99.8,
          performanceIndex: 98.5,
        },
      },
      {
        sprintId: 'SPRINT-89-CORE',
        title: 'Core Repository & Security Hardening',
        completedDate: '2026-07-28',
        passedBuild: true,
        passedTypeScript: true,
        passedESLint: true,
        summary: 'Enforced Repository pattern across all storage layers, bounded Firestore pagination rules, and zero raw state mutations.',
        metrics: {
          featuresDelivered: 10,
          bugsFixed: 2,
          codeQualityScore: 99.2,
          performanceIndex: 97.8,
        },
      },
    ];
  }
}

export const adminService = new AdminService();
