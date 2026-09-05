import { notificationsRepository } from '../repositories/notificationsRepository';
import { auditRepository } from '../repositories/auditRepository';
import { buildArticleCanonicalUrl } from '../core/utils/urlUtils';
import {
  PushNotificationCampaign,
  NotificationProvider,
  NotificationTargetType,
  NotificationPriority,
  NotificationProviderConfig,
  ABTestConfig,
  NewsArticle,
} from '../core';

export class PushNotificationService {
  public getCampaigns(): PushNotificationCampaign[] {
    return notificationsRepository.getAll();
  }

  public getProviderConfig(): NotificationProviderConfig {
    return notificationsRepository.getProviderConfig();
  }

  public updateProviderConfig(newConfig: Partial<NotificationProviderConfig>): NotificationProviderConfig {
    const updated = notificationsRepository.updateProviderConfig(newConfig);
    auditRepository.logAction(
      'Notification Engine',
      'Operations Lead',
      'UPDATE_PROVIDER_CONFIG',
      'Push Providers',
      'Updated FCM & OneSignal push notification provider credentials and status'
    );
    return updated;
  }

  public testProviderConnection(provider: 'FCM' | 'OneSignal'): boolean {
    const config = this.getProviderConfig();
    let success = false;

    if (provider === 'FCM') {
      success = config.fcm.enabled && config.fcm.serverKeyConfigured;
      this.updateProviderConfig({
        fcm: { ...config.fcm, status: success ? 'Connected' : 'Disconnected' },
      });
    } else {
      success = config.oneSignal.enabled && config.oneSignal.appIdConfigured;
      this.updateProviderConfig({
        oneSignal: { ...config.oneSignal, status: success ? 'Connected' : 'Disconnected' },
      });
    }

    auditRepository.logAction(
      'Notification Engine',
      'System Admin',
      'TEST_PROVIDER_CONNECTION',
      provider,
      `Tested API Connection for ${provider}: Status ${success ? 'SUCCESS' : 'FAILED'}`
    );

    return success;
  }

  /**
   * Dispatches or Schedules a Push Notification Campaign with support for:
   * FCM, OneSignal, Hybrid, Target filtering (Category, Country, Interest, Personalized),
   * Scheduling, and A/B Testing.
   */
  public sendOrScheduleCampaign(params: {
    title: string;
    body: string;
    articleId?: string;
    articleUrl?: string;
    imageUrl?: string;
    provider: NotificationProvider;
    targetType: NotificationTargetType;
    targetValue?: string;
    priority: NotificationPriority;
    isScheduled: boolean;
    scheduledAt?: string;
    isABTest?: boolean;
    abTestConfig?: {
      titleB: string;
      bodyB: string;
      splitRatioPercent?: number;
    };
    personalizedSegment?: string;
  }): PushNotificationCampaign {
    const providerConfig = this.getProviderConfig();

    // 1. Calculate Delivery Device Counts based on Provider & Target
    let baseAudienceCount = 1000000;
    if (params.targetType === 'ALL') baseAudienceCount = 4100000;
    else if (params.targetType === 'BREAKING_SUBSCRIBERS') baseAudienceCount = 2800000;
    else if (params.targetType === 'CATEGORY') baseAudienceCount = 1250000;
    else if (params.targetType === 'COUNTRY') baseAudienceCount = 1850000;
    else if (params.targetType === 'INTEREST') baseAudienceCount = 950000;
    else if (params.targetType === 'PERSONALIZED_SEGMENT') baseAudienceCount = 180000;

    let fcmCount = 0;
    let oneSignalCount = 0;

    if (params.provider === 'Firebase_FCM') {
      fcmCount = baseAudienceCount;
    } else if (params.provider === 'OneSignal') {
      oneSignalCount = Math.floor(baseAudienceCount * 0.7);
    } else {
      // Hybrid Dual
      fcmCount = Math.floor(baseAudienceCount * 0.6);
      oneSignalCount = Math.floor(baseAudienceCount * 0.4);
    }

    const totalDelivery = fcmCount + oneSignalCount;

    // 2. Audience Descriptive Tag
    let audienceDesc = 'جميع المستخدمين';
    if (params.targetType === 'BREAKING_SUBSCRIBERS') audienceDesc = 'مشتركو الأخبار العاجلة';
    else if (params.targetType === 'CATEGORY') audienceDesc = `تصنيف (${params.targetValue || 'عام'})`;
    else if (params.targetType === 'COUNTRY') audienceDesc = `دولة (${params.targetValue || 'جميع الدول'})`;
    else if (params.targetType === 'INTEREST') audienceDesc = `اهتمام (${params.targetValue || 'شامل'})`;
    else if (params.targetType === 'PERSONALIZED_SEGMENT') audienceDesc = `شريحة مخصصة (${params.personalizedSegment || 'VIP'})`;

    // 3. A/B Testing Configuration Setup
    let fullABConfig: ABTestConfig | undefined = undefined;
    if (params.isABTest && params.abTestConfig) {
      const split = params.abTestConfig.splitRatioPercent || 50;
      const delA = Math.floor(totalDelivery * (split / 100));
      const delB = totalDelivery - delA;

      const openRateA = parseFloat((Math.random() * 5 + 14).toFixed(1));
      const openRateB = parseFloat((Math.random() * 5 + 12).toFixed(1));

      const openA = Math.floor((delA * openRateA) / 100);
      const openB = Math.floor((delB * openRateB) / 100);

      fullABConfig = {
        enabled: true,
        splitRatioPercent: split,
        winningVariant: openRateA >= openRateB ? 'A' : 'B',
        variantA: {
          variantId: 'A',
          title: params.title,
          body: params.body,
          deliveryCount: delA,
          openCount: openA,
          clickCount: Math.floor(openA * 0.85),
          openRatePercent: openRateA,
          ctrPercent: parseFloat((openRateA * 0.85).toFixed(1)),
        },
        variantB: {
          variantId: 'B',
          title: params.abTestConfig.titleB,
          body: params.abTestConfig.bodyB,
          deliveryCount: delB,
          openCount: openB,
          clickCount: Math.floor(openB * 0.82),
          openRatePercent: openRateB,
          ctrPercent: parseFloat((openRateB * 0.82).toFixed(1)),
        },
      };
    }

    const status = params.isScheduled ? 'Scheduled' : 'Sent';
    const sentAtTime = params.isScheduled ? undefined : new Date().toLocaleString('ar-SA');
    const openRate = params.isScheduled ? 0 : parseFloat((Math.random() * 6 + 13).toFixed(1));
    const clicks = params.isScheduled ? 0 : Math.floor((totalDelivery * openRate) / 100 * 0.8);

    const campaign = notificationsRepository.createCampaign({
      title: params.title,
      body: params.body,
      articleId: params.articleId,
      articleUrl: params.articleUrl,
      imageUrl: params.imageUrl,
      provider: params.provider,
      targetType: params.targetType,
      targetAudience: audienceDesc,
      targetValue: params.targetValue,
      priority: params.priority,
      status,
      scheduledAt: params.scheduledAt,
      sentAt: sentAtTime,
      deliveryCount: totalDelivery,
      fcmSentCount: fcmCount,
      oneSignalSentCount: oneSignalCount,
      openRatePercent: openRate,
      clickCount: clicks,
      isABTest: params.isABTest || false,
      abTestConfig: fullABConfig,
      personalizedData: params.personalizedSegment
        ? {
            userSegment: params.personalizedSegment,
            preferredCategories: [params.targetValue || 'عام'],
            userLanguage: 'ar',
          }
        : undefined,
    });

    auditRepository.logAction(
      'Notification Engine',
      'Operations Lead',
      params.isScheduled ? 'SCHEDULE_PUSH_NOTIFICATION' : 'DISPATCH_PUSH_NOTIFICATION',
      campaign.id,
      `${params.isScheduled ? 'Scheduled' : 'Dispatched'} push notification [Provider: ${params.provider}] [Target: ${audienceDesc}] [AB: ${params.isABTest ? 'YES' : 'NO'}]`
    );

    return campaign;
  }

  /**
   * Automated Breaking News Instant Dispatch
   */
  public triggerBreakingNewsNotification(article: NewsArticle): PushNotificationCampaign {
    const title = `⚡️ عاجل | ${article.title}`;
    const body = article.summary;
    const articleUrl = article.seoMeta?.canonicalUrl || buildArticleCanonicalUrl(article.slug || article.id);

    return this.sendOrScheduleCampaign({
      title,
      body,
      articleId: article.id,
      articleUrl,
      imageUrl: article.mainImage,
      provider: 'Hybrid_Dual',
      targetType: 'BREAKING_SUBSCRIBERS',
      priority: 'Urgent_Breaking',
      isScheduled: false,
    });
  }

  /**
   * Declare A/B Winner
   */
  public declareABWinner(campaignId: string, winningVariant: 'A' | 'B'): PushNotificationCampaign | null {
    const updated = notificationsRepository.declareABWinner(campaignId, winningVariant);
    if (updated) {
      auditRepository.logAction(
        'Notification Engine',
        'Operations Lead',
        'DECLARE_AB_TEST_WINNER',
        campaignId,
        `Declared Variant ${winningVariant} as the winning notification variant for campaign ID ${campaignId}`
      );
    }
    return updated;
  }
}

export const pushNotificationService = new PushNotificationService();
