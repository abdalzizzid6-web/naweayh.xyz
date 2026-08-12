import { BaseRepository } from './baseRepository';
import { PushNotificationCampaign, NotificationProviderConfig } from '../types';

const INITIAL_CAMPAIGNS: PushNotificationCampaign[] = [
  {
    id: 'pnc-101',
    title: '🔴 عاجل | المملكة تعلن إطلاق ميثاق حوكمة الذكاء الاصطناعي باستثمار 15 مليار دولار',
    body: 'تغطية مباشرة وشاملة للتفاصيل الكاملة لبناء أكبر شبكة مراكز بيانات فائقة القدرة في الرياض.',
    articleId: 'art-1',
    articleUrl: 'https://naweayh.xyz/article/art-1',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    provider: 'Hybrid_Dual',
    targetType: 'BREAKING_SUBSCRIBERS',
    targetAudience: 'مشتركو الأخبار العاجلة (كافة الأجهزة)',
    priority: 'Urgent_Breaking',
    status: 'Sent',
    sentAt: '2026-08-07 13:35:00',
    deliveryCount: 3850000,
    fcmSentCount: 2200000,
    oneSignalSentCount: 1650000,
    openRatePercent: 18.4,
    clickCount: 708400,
    isABTest: false,
  },
  {
    id: 'pnc-102',
    title: '📊 [اختبار A/B] انتعاش مؤشرات الأسواق المالية الخليجية بنسبة 3.4%',
    body: 'مكاسب استثنائية لقطاعات المصارف والطاقة وسط ارتفاع معدلات السيولة التداولية.',
    articleId: 'art-2',
    articleUrl: 'https://naweayh.xyz/article/art-2',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800',
    provider: 'Firebase_FCM',
    targetType: 'CATEGORY',
    targetAudience: 'مهتمو تصنيف (اقتصاد - الأسواق)',
    targetValue: 'اقتصاد',
    priority: 'High',
    status: 'Sent',
    sentAt: '2026-08-07 11:20:00',
    deliveryCount: 1240000,
    fcmSentCount: 1240000,
    oneSignalSentCount: 0,
    openRatePercent: 16.8,
    clickCount: 208320,
    isABTest: true,
    abTestConfig: {
      enabled: true,
      variantA: {
        variantId: 'A',
        title: '📈 الأسواق الخليجية تقفز 3.4% وتغلق عند أعلى مستوى في 6 أشهر',
        body: 'انتعاش مكاسب المصارف والطاقة وسط تفاؤل المستثمرين بحجم السيولة.',
        deliveryCount: 620000,
        openCount: 111600,
        clickCount: 104160,
        openRatePercent: 18.0,
        ctrPercent: 16.8,
      },
      variantB: {
        variantId: 'B',
        title: '📊 صعود جماعي لأسواق المال الخليجية بقيادة قطاع الطاقة',
        body: 'اقرأ تحليل خبراء أخبار نوعية لحركة الأسهم والفرص الاستثمارية القادمة.',
        deliveryCount: 620000,
        openCount: 96720,
        clickCount: 88040,
        openRatePercent: 15.6,
        ctrPercent: 14.2,
      },
      splitRatioPercent: 50,
      winningVariant: 'A',
    },
  },
  {
    id: 'pnc-103',
    title: '🇸🇦 التغطية الخاصة بالسعودية: إطلاق مشاريع طاقة متجددة جديدة',
    body: 'مشروع توليد الطاقة الشمسية والهيدروجين الأخضر يدخل مرحلة التنفيذ الفعلي.',
    articleId: 'art-3',
    articleUrl: 'https://naweayh.xyz/article/art-3',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    provider: 'OneSignal',
    targetType: 'COUNTRY',
    targetAudience: 'مستخدمو تطبيق أخبار نوعية في (المملكة العربية السعودية)',
    targetValue: 'السعودية',
    priority: 'High',
    status: 'Sent',
    sentAt: '2026-08-07 09:15:00',
    deliveryCount: 1890000,
    fcmSentCount: 0,
    oneSignalSentCount: 1890000,
    openRatePercent: 14.2,
    clickCount: 268380,
    isABTest: false,
  },
  {
    id: 'pnc-104',
    title: '🤖 مخصص لك: أحدث تحليلات معالجات الذكاء الاصطناعي التكيفي',
    body: 'بناءً على اهتمامك بالتقنية والهواتف الذكية، إليك ملخص المؤتمر الدولي.',
    articleId: 'art-4',
    articleUrl: 'https://naweayh.xyz/article/art-4',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    provider: 'Hybrid_Dual',
    targetType: 'INTEREST',
    targetAudience: 'شريحة المهتمين بـ (الذكاء الاصطناعي والتقنية)',
    targetValue: 'الذكاء الاصطناعي',
    priority: 'Normal',
    status: 'Scheduled',
    scheduledAt: '2026-08-08 10:00:00',
    deliveryCount: 950000,
    fcmSentCount: 550000,
    oneSignalSentCount: 400000,
    openRatePercent: 0,
    clickCount: 0,
    isABTest: false,
  },
  {
    id: 'pnc-105',
    title: '🎯 إشعار مخصص للغاية: ملخص تحليلات المحفظة الاستثمارية الأسبوعي',
    body: 'تم تجهيز تقريرك المخصص حول أسهم التقنية والطاقة النظيفة لـ 2026.',
    provider: 'Firebase_FCM',
    targetType: 'PERSONALIZED_SEGMENT',
    targetAudience: 'شريحة المستثمرين وكبار المتابعين VIP',
    targetValue: 'VIP_Investors',
    priority: 'Normal',
    status: 'Scheduled',
    scheduledAt: '2026-08-08 14:30:00',
    deliveryCount: 145000,
    fcmSentCount: 145000,
    oneSignalSentCount: 0,
    openRatePercent: 0,
    clickCount: 0,
    personalizedData: {
      userSegment: 'VIP_Investors',
      preferredCategories: ['اقتصاد', 'تقنية'],
      userLanguage: 'ar',
    },
  },
];

const INITIAL_PROVIDER_CONFIG: NotificationProviderConfig = {
  fcm: {
    enabled: true,
    serverKeyConfigured: true,
    projectId: 'naw3iya-news-prod-fcm',
    activeTokensCount: 3420000,
    status: 'Connected',
  },
  oneSignal: {
    enabled: true,
    appIdConfigured: true,
    appId: 'onesignal-app-naw3iya-773291',
    activePlayersCount: 2150000,
    status: 'Connected',
  },
};

export class NotificationsRepository extends BaseRepository<PushNotificationCampaign> {
  private configStorageKey = 'safara90_notification_providers_v1';

  constructor() {
    super('safara90_push_campaigns_v1');
    this.seedIfEmpty();
  }

  private seedIfEmpty(): void {
    if (this.getStoredItems().length === 0) {
      this.setStoredItems(INITIAL_CAMPAIGNS);
    }
  }

  public getProviderConfig(): NotificationProviderConfig {
    try {
      const stored = localStorage.getItem(this.configStorageKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_PROVIDER_CONFIG;
  }

  public updateProviderConfig(newConfig: Partial<NotificationProviderConfig>): NotificationProviderConfig {
    const current = this.getProviderConfig();
    const updated: NotificationProviderConfig = {
      fcm: { ...current.fcm, ...newConfig.fcm },
      oneSignal: { ...current.oneSignal, ...newConfig.oneSignal },
    };
    try {
      localStorage.setItem(this.configStorageKey, JSON.stringify(updated));
    } catch {
      // fallback
    }
    return updated;
  }

  public createCampaign(campaignData: Omit<PushNotificationCampaign, 'id'>): PushNotificationCampaign {
    const newCamp: PushNotificationCampaign = {
      ...campaignData,
      id: `pnc-${Date.now()}`,
    };
    this.add(newCamp);
    return newCamp;
  }

  public updateCampaignStatus(
    id: string,
    status: PushNotificationCampaign['status'],
    sentAt?: string
  ): PushNotificationCampaign | null {
    return this.update(id, {
      status,
      sentAt: sentAt || new Date().toLocaleString('ar-SA'),
    });
  }

  public declareABWinner(campaignId: string, winningVariant: 'A' | 'B'): PushNotificationCampaign | null {
    const camp = this.getById(campaignId);
    if (!camp || !camp.abTestConfig) return null;

    const updatedABConfig = {
      ...camp.abTestConfig,
      winningVariant,
    };

    return this.update(campaignId, {
      abTestConfig: updatedABConfig,
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
