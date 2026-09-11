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

    // 1. Calculate Delivery Device Counts based on actual configured Provider tokens
    const fcmTokens = (providerConfig.fcm.enabled && providerConfig.fcm.status === 'Connected')
      ? providerConfig.fcm.activeTokensCount
      : 0;
    const oneSignalTokens = (providerConfig.oneSignal.enabled && providerConfig.oneSignal.status === 'Connected')
      ? providerConfig.oneSignal.activePlayersCount
      : 0;

    let fcmCount = 0;
    let oneSignalCount = 0;

    if (params.provider === 'Firebase_FCM') {
      fcmCount = fcmTokens;
    } else if (params.provider === 'OneSignal') {
      oneSignalCount = oneSignalTokens;
    } else {
      // Hybrid Dual
      fcmCount = fcmTokens;
      oneSignalCount = oneSignalTokens;
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

      fullABConfig = {
        enabled: true,
        splitRatioPercent: split,
        winningVariant: undefined,
        variantA: {
          variantId: 'A',
          title: params.title,
          body: params.body,
          deliveryCount: delA,
          openCount: 0,
          clickCount: 0,
          openRatePercent: 0,
          ctrPercent: 0,
        },
        variantB: {
          variantId: 'B',
          title: params.abTestConfig.titleB,
          body: params.abTestConfig.bodyB,
          deliveryCount: delB,
          openCount: 0,
          clickCount: 0,
          openRatePercent: 0,
          ctrPercent: 0,
        },
      };
    }

    const status = params.isScheduled 
      ? 'Scheduled' 
      : (totalDelivery > 0 ? 'Sent' : 'Draft');
    const sentAtTime = params.isScheduled ? undefined : new Date().toLocaleString('ar-SA');
    const openRate = 0;
    const clicks = 0;

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
