import { sourcesRepository } from '../repositories/sourcesRepository';
import { aggregationQueue } from './AggregationQueue';
import { auditRepository } from '../repositories/auditRepository';
import { EventBus } from '../infrastructure';

export type SchedulerStatus = 'Running' | 'Paused';

export class AggregationScheduler {
  private status: SchedulerStatus = 'Running';
  private intervalMinutes: number = 5;
  private secondsRemaining: number = 300; // 5 minutes countdown
  private timerId: NodeJS.Timeout | null = null;
  private tickerId: NodeJS.Timeout | null = null;
  private lastRunTime: string = new Date().toLocaleTimeString('ar-EG');
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.startScheduler();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
    EventBus.publish('SCHEDULER_STATUS_CHANGED', {
      status: this.status,
      secondsRemaining: this.secondsRemaining,
      intervalMinutes: this.intervalMinutes,
      lastRunTime: this.lastRunTime,
    });
  }

  public startScheduler(): void {
    this.status = 'Running';
    this.resetTimer();
    this.notify();
  }

  public pauseScheduler(): void {
    this.status = 'Paused';
    if (this.timerId) clearInterval(this.timerId);
    if (this.tickerId) clearInterval(this.tickerId);
    this.notify();
  }

  public setIntervalMinutes(minutes: number): void {
    this.intervalMinutes = Math.max(1, Math.min(60, minutes));
    this.resetTimer();
    this.notify();
  }

  private resetTimer(): void {
    if (this.timerId) clearInterval(this.timerId);
    if (this.tickerId) clearInterval(this.tickerId);

    this.secondsRemaining = this.intervalMinutes * 60;

    this.tickerId = setInterval(() => {
      if (this.status === 'Running') {
        if (this.secondsRemaining > 0) {
          this.secondsRemaining--;
          this.notify();
        } else {
          this.triggerScheduledBatchSync();
          this.secondsRemaining = this.intervalMinutes * 60;
        }
      }
    }, 1000);
  }

  public triggerScheduledBatchSync(): void {
    const activeSources = sourcesRepository.getActiveSources();
    this.lastRunTime = new Date().toLocaleTimeString('ar-EG');
    
    aggregationQueue.enqueueBatch(activeSources);

    auditRepository.logAction(
      'Automated Scheduler',
      'System Admin',
      'TRIGGER_5MIN_NEWS_SYNC',
      'Active Feeds',
      `Auto-triggered 5-minute news aggregation cycle for ${activeSources.length} active sources.`
    );

    this.secondsRemaining = this.intervalMinutes * 60;
    this.notify();
  }

  public getStatus() {
    return {
      status: this.status,
      intervalMinutes: this.intervalMinutes,
      secondsRemaining: this.secondsRemaining,
      formattedCountdown: this.formatSeconds(this.secondsRemaining),
      lastRunTime: this.lastRunTime,
    };
  }

  private formatSeconds(totalSecs: number): string {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export const aggregationScheduler = new AggregationScheduler();
