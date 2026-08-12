import { BaseRepository } from './baseRepository';
import { MetricItem, SystemHealth } from '../types';

const INITIAL_METRICS: MetricItem[] = [
  {
    id: 'm1',
    label: 'Total Operational Budget',
    value: '$1,330,000',
    changePercent: 12.4,
    isPositive: true,
    period: 'vs previous quarter',
    category: 'Financial',
  },
  {
    id: 'm2',
    label: 'Capital Efficiency Index',
    value: '94.2%',
    changePercent: 3.8,
    isPositive: true,
    period: 'vs target 90%',
    category: 'Financial',
  },
  {
    id: 'm3',
    label: 'Active Sprint Throughput',
    value: '87 Tasks/Wk',
    changePercent: 15.1,
    isPositive: true,
    period: 'vs 30-day baseline',
    category: 'Operations',
  },
  {
    id: 'm4',
    label: 'Resource Allocation Index',
    value: '91.8%',
    changePercent: 1.2,
    isPositive: true,
    period: 'optimal threshold',
    category: 'Resource',
  },
  {
    id: 'm5',
    label: 'Security Audit Compliance',
    value: '100%',
    changePercent: 0,
    isPositive: true,
    period: 'zero critical breaches',
    category: 'Security',
  },
  {
    id: 'm6',
    label: 'System API Latency (p99)',
    value: '42 ms',
    changePercent: -8.5,
    isPositive: true,
    period: 'improved response time',
    category: 'Operations',
  },
];

export class MetricsRepository extends BaseRepository<MetricItem> {
  constructor() {
    super('safara90_metrics_v1');
    this.seedIfEmpty();
  }

  private seedIfEmpty(): void {
    if (this.getStoredItems().length === 0) {
      this.setStoredItems(INITIAL_METRICS);
    }
  }

  public getByCategory(category: string): MetricItem[] {
    const items = this.getStoredItems();
    if (category === 'All') return items;
    return items.filter((m) => m.category === category);
  }

  public getSystemHealth(): SystemHealth {
    return {
      cpuUsage: 18.4,
      memoryUsage: 34.2,
      activeSessions: 142,
      apiLatencyMs: 42,
      status: 'Optimal',
      redisHitRatePercent: 99.4,
      databaseConnections: 120,
      totalArticlesInCluster: 1248900,
    };
  }
}

export const metricsRepository = new MetricsRepository();
