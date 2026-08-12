import { BaseRepository } from './baseRepository';
import { SocialChannelConfig, SocialPlatform } from '../types';

const INITIAL_SOCIAL_CHANNELS: SocialChannelConfig[] = [
  {
    id: 'soc-fb',
    platform: 'Facebook',
    channelName: 'صفحة أخبار نوعية الرسمية',
    accountHandle: '@Naw3iyaNews',
    accountAvatar: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=100',
    enabled: true,
    autoPublishCategories: ['الكل'],
    autoPublishSources: ['الكل'],
    autoPublishCountries: ['الكل'],
    template: '{title}\n\n{summary}\n\n📖 اقرأ الخبر كاملاً والتحليلات عبر الرابط:\n{url}',
    defaultHashtags: ['#أخبار_نوعية', '#نوعية', '#أخبار_عاجلة'],
    scheduleDelayMinutes: 0,
    totalPublished: 42100,
  },
  {
    id: 'soc-ig',
    platform: 'Instagram',
    channelName: 'أخبار نوعية — Naw3iya Instagram',
    accountHandle: '@naw3iya.official',
    accountAvatar: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=100',
    enabled: true,
    autoPublishCategories: ['تقنية', 'اقتصاد', 'رياضة', 'سيارات', 'علوم'],
    autoPublishSources: ['الكل'],
    autoPublishCountries: ['اليمن', 'السعودية', 'الإمارات', 'مصر', 'قطر'],
    template: '📸 {title}\n\n{summary}\n\n🔗 الرابط في البايو والتغطية المباشرة حصرياً.',
    defaultHashtags: ['#أخبار_نوعية', '#نوعية', '#تغطية_خاصة', '#اقتصاد', '#تقنية'],
    scheduleDelayMinutes: 2,
    totalPublished: 18400,
  },
  {
    id: 'soc-x',
    platform: 'X',
    channelName: 'أخبار نوعية — Naw3iya X',
    accountHandle: '@Naw3iyaNews',
    accountAvatar: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=100',
    enabled: true,
    autoPublishCategories: ['عاجل', 'تقنية', 'اقتصاد', 'سياسة'],
    autoPublishSources: ['الكل'],
    autoPublishCountries: ['الكل'],
    template: '🔴 {title}\n\n{summary}\n\n التفاصيل الكاملة: {url}',
    defaultHashtags: ['#عاجل', '#أخبار_نوعية', '#نوعية'],
    scheduleDelayMinutes: 0,
    totalPublished: 89400,
  },
  {
    id: 'soc-tg',
    platform: 'Telegram',
    channelName: 'قناة أخبار نوعية — Telegram Official',
    accountHandle: 't.me/Naw3iyaNews',
    accountAvatar: 'https://images.unsplash.com/photo-1614680376593-902f749f7ba3?w=100',
    enabled: true,
    autoPublishCategories: ['الكل'],
    autoPublishSources: ['الكل'],
    autoPublishCountries: ['الكل'],
    template: '⚡️ <b>{title}</b>\n\n{summary}\n\n🔗 <a href="{url}">اقرأ الخبر كاملاً في المنصة</a>',
    defaultHashtags: ['#تليجرام', '#أخبار_نوعية', '#تغطية_مباشرة'],
    scheduleDelayMinutes: 0,
    totalPublished: 65200,
  },
  {
    id: 'soc-wa',
    platform: 'WhatsApp',
    channelName: 'قناة أخبار نوعية — WhatsApp Channels',
    accountHandle: 'whatsapp.com/channel/naw3iya',
    accountAvatar: 'https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=100',
    enabled: true,
    autoPublishCategories: ['عاجل', 'اقتصاد', 'سياسة'],
    autoPublishSources: ['الكل'],
    autoPublishCountries: ['اليمن', 'السعودية', 'الإمارات', 'مصر'],
    template: '*عاجل | {title}*\n\n{summary}\n\n📌 رابط المتابعة: {url}',
    defaultHashtags: ['#واتساب_المباشر', '#أخبار_نوعية'],
    scheduleDelayMinutes: 1,
    totalPublished: 54100,
  },
  {
    id: 'soc-li',
    platform: 'LinkedIn',
    channelName: 'Naw3iya News Network - LinkedIn Page',
    accountHandle: 'linkedin.com/company/naw3iya-news',
    accountAvatar: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=100',
    enabled: true,
    autoPublishCategories: ['اقتصاد', 'تقنية', 'علوم'],
    autoPublishSources: ['الكل'],
    autoPublishCountries: ['الكل'],
    template: '💼 {title}\n\n{summary}\n\nللقراءة والتحليل الاقتصادي الشامل:\n{url}',
    defaultHashtags: ['#Naw3iya', '#Business', '#MiddleEast', '#Tech', '#Economy'],
    scheduleDelayMinutes: 5,
    totalPublished: 12800,
  },
  {
    id: 'soc-th',
    platform: 'Threads',
    channelName: 'أخبار نوعية Threads Network',
    accountHandle: '@naw3iya.threads',
    accountAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
    enabled: true,
    autoPublishCategories: ['الكل'],
    autoPublishSources: ['الكل'],
    autoPublishCountries: ['الكل'],
    template: '🧵 {title}\n\n{summary}\n\nرابط الخبر بالتفصيل:\n{url}',
    defaultHashtags: ['#Threads', '#أخبار_نوعية'],
    scheduleDelayMinutes: 0,
    totalPublished: 9200,
  },
  {
    id: 'soc-pi',
    platform: 'Pinterest',
    channelName: 'لوحة أخبار نوعية — Pinterest',
    accountHandle: 'pinterest.com/naw3iya',
    accountAvatar: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=100',
    enabled: true,
    autoPublishCategories: ['تقنية', 'سيارات', 'علوم', 'صحة', 'رياضة'],
    autoPublishSources: ['الكل'],
    autoPublishCountries: ['الكل'],
    template: '📌 {title}\n\n{summary}\n\nالمصدر والرابط الأصلي:\n{url}',
    defaultHashtags: ['#Infographic', '#NewsPin', '#أخبار_نوعية'],
    scheduleDelayMinutes: 3,
    totalPublished: 4800,
  },
  {
    id: 'soc-bs',
    platform: 'Bluesky',
    channelName: 'أخبار نوعية — Bluesky Social',
    accountHandle: '@naw3iya.bsky.social',
    accountAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
    enabled: true,
    autoPublishCategories: ['الكل'],
    autoPublishSources: ['الكل'],
    autoPublishCountries: ['الكل'],
    template: '🦋 {title}\n\n{summary}\n\n{url}',
    defaultHashtags: ['#BlueskyNews', '#أخبار_نوعية'],
    scheduleDelayMinutes: 0,
    totalPublished: 7100,
  },
];

export class SocialChannelsRepository extends BaseRepository<SocialChannelConfig> {
  constructor() {
    super('safara90_social_channels_v2');
    this.seedIfEmpty();
  }

  private seedIfEmpty(): void {
    if (this.getStoredItems().length === 0) {
      this.setStoredItems(INITIAL_SOCIAL_CHANNELS);
    }
  }

  public toggleChannel(id: string): SocialChannelConfig | null {
    const ch = this.getById(id);
    if (ch) {
      return this.update(id, { enabled: !ch.enabled });
    }
    return null;
  }

  public updateChannelConfig(id: string, updates: Partial<SocialChannelConfig>): SocialChannelConfig | null {
    return this.update(id, updates);
  }
}

export const socialChannelsRepository = new SocialChannelsRepository();
