import { metricsRepository } from '../repositories/metricsRepository';
import { SystemHealth } from '../types';

export class AnalyticsService {
  public getMetrics(category: string = 'All') {
    return metricsRepository.getByCategory(category);
  }

  public getSystemHealth(): SystemHealth {
    return metricsRepository.getSystemHealth();
  }

  public getPerformanceTrends() {
    return [
      { month: 'Jan', velocity: 68, budgetEfficiency: 88, compliance: 98 },
      { month: 'Feb', velocity: 74, budgetEfficiency: 90, compliance: 99 },
      { month: 'Mar', velocity: 79, budgetEfficiency: 91, compliance: 100 },
      { month: 'Apr', velocity: 82, budgetEfficiency: 93, compliance: 100 },
      { month: 'May', velocity: 85, budgetEfficiency: 92, compliance: 100 },
      { month: 'Jun', velocity: 89, budgetEfficiency: 95, compliance: 100 },
      { month: 'Jul', velocity: 94, budgetEfficiency: 94, compliance: 100 },
    ];
  }

  public getResourceDistribution() {
    return [
      { name: 'Core Engine & AI', allocation: 38 },
      { name: 'Security & Audit', allocation: 25 },
      { name: 'Infrastructure & DevOps', allocation: 20 },
      { name: 'Operations & Allocations', allocation: 17 },
    ];
  }
}

export const analyticsService = new AnalyticsService();
