import { BaseRepository } from './baseRepository';
import { SocialPostItem, SocialPlatform } from '../types';

const INITIAL_SOCIAL_POSTS: SocialPostItem[] = [
  {
    id: 'post-101',
    articleId: 'art-1',
    articleTitle: 'المملكة تعلن إطلاق مبادرة الذكاء الاصطناعي الوطنية للشرق الأوسط',
    articleSummary: 'شهدت الرياض إطلاق أكبر استثمار تقني للذكاء الاصطناعي لترسيخ الابتكار وتعزيز الاقتصاد الرقمي.',
    articleImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    articleUrl: 'https://naweayh.xyz/article/art-1',
    category: 'تقنية',
    sourceName: 'وكالة الأنباء السعودية (واس)',
    country: 'السعودية',
    platform: 'X',
    formattedContent: '🔴 المملكة تعلن إطلاق مبادرة الذكاء الاصطناعي الوطنية للشرق الأوسط\n\nشهدت الرياض إطلاق أكبر استثمار تقني للذكاء الاصطناعي لترسيخ الابتكار وتعزيز الاقتصاد الرقمي.\n\nالتفاصيل الكاملة: https://naweayh.xyz/article/art-1\n\n#أخبار_نوعية #أخبار_عاجلة #الذكاء_الاصطناعي #السعودية',
    hashtags: ['#أخبار_نوعية', '#أخبار_عاجلة', '#الذكاء_الاصطناعي', '#السعودية'],
    status: 'Published',
    scheduledAt: '2026-08-07 07:30:00',
    publishedAt: '2026-08-07 07:30:05',
    republishCount: 1,
    engagement: { views: 18400, likes: 1420, shares: 380, clicks: 2150 },
  },
  {
    id: 'post-102',
    articleId: 'art-1',
    articleTitle: 'المملكة تعلن إطلاق مبادرة الذكاء الاصطناعي الوطنية للشرق الأوسط',
    articleSummary: 'شهدت الرياض إطلاق أكبر استثمار تقني للذكاء الاصطناعي لترسيخ الابتكار وتعزيز الاقتصاد الرقمي.',
    articleImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    articleUrl: 'https://naweayh.xyz/article/art-1',
    category: 'تقنية',
    sourceName: 'وكالة الأنباء السعودية (واس)',
    country: 'السعودية',
    platform: 'Telegram',
    formattedContent: '⚡️ <b>المملكة تعلن إطلاق مبادرة الذكاء الاصطناعي الوطنية للشرق الأوسط</b>\n\nشهدت الرياض إطلاق أكبر استثمار تقني للذكاء الاصطناعي.\n\n🔗 اقرأ الخبر كاملاً: https://naweayh.xyz/article/art-1\n\n#تليجرام #أخبار_نوعية #تغطية_مباشرة',
    hashtags: ['#تليجرام', '#أخبار_نوعية', '#تغطية_مباشرة'],
    status: 'Published',
    scheduledAt: '2026-08-07 07:30:00',
    publishedAt: '2026-08-07 07:30:08',
    republishCount: 0,
    engagement: { views: 24500, likes: 1890, shares: 620, clicks: 3100 },
  },
  {
    id: 'post-103',
    articleId: 'art-2',
    articleTitle: 'ارتفاع مؤشرات الأسواق المالية الخليجية بنسبة 3.4% مع انتعاش التداول',
    articleSummary: 'حققت أسواق المال الخليجية مكاسب قياسية ملحوظة بدعم من قطاعات الطاقة والتكنولوجيا والمصارف.',
    articleImage: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800',
    articleUrl: 'https://naweayh.xyz/article/art-2',
    category: 'اقتصاد',
    sourceName: 'بلومبرغ الشرق الأوسط',
    country: 'الإمارات',
    platform: 'LinkedIn',
    formattedContent: '💼 ارتفاع مؤشرات الأسواق المالية الخليجية بنسبة 3.4% مع انتعاش التداول\n\nحققت أسواق المال الخليجية مكاسب قياسية ملحوظة بدعم من قطاعات الطاقة والتكنولوجيا والمصارف.\n\nللقراءة والتحليل الاقتصادي الشامل:\nhttps://naweayh.xyz/article/art-2\n\n#Business #MiddleEast #Tech #Economy',
    hashtags: ['#Business', '#MiddleEast', '#Tech', '#Economy'],
    status: 'Published',
    scheduledAt: '2026-08-07 07:15:00',
    publishedAt: '2026-08-07 07:15:12',
    republishCount: 0,
    engagement: { views: 8900, likes: 450, shares: 92, clicks: 840 },
  },
  {
    id: 'post-104',
    articleId: 'art-3',
    articleTitle: 'قمة المناخ والحلول المستدامة تبدأ أعمالها بحضور إقليمي واسع',
    articleSummary: 'انطلقت أعمال قمة المناخ لبحث شراكات التحول نحو الطاقة النظيفة وتقليل الانبعاثات الكربونية.',
    articleImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    articleUrl: 'https://naweayh.xyz/article/art-3',
    category: 'علوم',
    sourceName: 'رويترز الشرق الأوسط',
    country: 'مصر',
    platform: 'Facebook',
    formattedContent: 'قمة المناخ والحلول المستدامة تبدأ أعمالها بحضور إقليمي واسع\n\nانطلقت أعمال قمة المناخ لبحث شراكات التحول نحو الطاقة النظيفة وتقليل الانبعاثات الكربونية.\n\nللمزيد من الأخبار الموثوقة والتحليلات الحصرية زوروا موقعنا:\nhttps://naweayh.xyz/article/art-3\n\n#أخبار_نوعية #أخبار_عاجلة #مصر #السعودية',
    hashtags: ['#أخبار_نوعية', '#أخبار_عاجلة', '#مصر', '#السعودية'],
    status: 'Scheduled',
    scheduledAt: '2026-08-07 10:00:00',
    republishCount: 0,
    engagement: { views: 0, likes: 0, shares: 0, clicks: 0 },
  },
  {
    id: 'post-105',
    articleId: 'art-4',
    articleTitle: 'إطلاق أحدث هاتف ذكي يعتمد كلياً على معالجات الذكاء الاصطناعي التكيفي',
    articleSummary: 'كشفت الشركات العالمية عن تقنية الهواتف فائقة الاستجابة المجهزة بالذكاء الاصطناعي الفوري.',
    articleImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    articleUrl: 'https://naweayh.xyz/article/art-4',
    category: 'تقنية',
    sourceName: 'رويترز الشرق الأوسط',
    country: 'عالمي',
    platform: 'Instagram',
    formattedContent: '📸 إطلاق أحدث هاتف ذكي يعتمد كلياً على معالجات الذكاء الاصطناعي التكيفي\n\nكشفت الشركات العالمية عن تقنية الهواتف فائقة الاستجابة المجهزة بالذكاء الاصطناعي الفوري.\n\n🔗 الرابط في البايو والتغطية المباشرة حصرياً.\n\n#InstaNews #تغطية_خاصة #أخبار_نوعية #اقتصاد #تقنية',
    hashtags: ['#InstaNews', '#تغطية_خاصة', '#أخبار_نوعية', '#اقتصاد', '#تقنية'],
    status: 'Scheduled',
    scheduledAt: '2026-08-07 11:30:00',
    republishCount: 0,
    engagement: { views: 0, likes: 0, shares: 0, clicks: 0 },
  },
];

export class SocialPostsRepository extends BaseRepository<SocialPostItem> {
  constructor() {
    super('safara90_social_posts_v1');
    this.seedIfEmpty();
  }

  private seedIfEmpty(): void {
    if (this.getStoredItems().length === 0) {
      this.setStoredItems(INITIAL_SOCIAL_POSTS);
    }
  }

  public getPostsByStatus(status?: SocialPostItem['status']): SocialPostItem[] {
    const all = this.getAll();
    if (!status) return all;
    return all.filter((p) => p.status === status);
  }

  public schedulePost(postData: Omit<SocialPostItem, 'id' | 'republishCount' | 'engagement'>): SocialPostItem {
    const newPost: SocialPostItem = {
      ...postData,
      id: `post-${Date.now().toString().slice(-5)}`,
      republishCount: 0,
      engagement: { views: 0, likes: 0, shares: 0, clicks: 0 },
    };
    this.add(newPost);
    return newPost;
  }

  public republishPost(id: string): SocialPostItem | null {
    const post = this.getById(id);
    if (!post) return null;

    const updated = this.update(id, {
      status: 'Published',
      publishedAt: new Date().toLocaleString('ar-SA'),
      republishCount: post.republishCount + 1,
      engagement: {
        ...post.engagement,
        views: post.engagement.views + Math.floor(Math.random() * 500) + 100,
        shares: post.engagement.shares + Math.floor(Math.random() * 20) + 5,
      },
    });
    return updated;
  }

  public publishNow(id: string): SocialPostItem | null {
    const post = this.getById(id);
    if (!post) return null;

    return this.update(id, {
      status: 'Published',
      publishedAt: new Date().toLocaleString('ar-SA'),
    });
  }
}

export const socialPostsRepository = new SocialPostsRepository();
