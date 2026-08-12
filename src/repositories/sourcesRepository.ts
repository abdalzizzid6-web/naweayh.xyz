import { BaseRepository } from './baseRepository';
import { NewsSource, NewsSourceProtocol } from '../types';

const INITIAL_SOURCES: NewsSource[] = [
  {
    id: 'src-1',
    name: 'وكالة الأنباء الرسمية (SPA)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
    url: 'https://spa.gov.sa/rss/all.xml',
    type: 'RSS',
    category: 'سياسة',
    country: 'السعودية',
    language: 'ar',
    priority: 'High',
    reliabilityRating: 5,
    fetchFrequencyMinutes: 5,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:40:00',
    articlesCountToday: 142,
  },
  {
    id: 'src-2',
    name: 'رويترز العالمية (Reuters)',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=100&q=80',
    url: 'https://reuters.com/rss/ar',
    type: 'Reuters',
    category: 'سياسة',
    country: 'عالمي',
    language: 'ar',
    priority: 'High',
    reliabilityRating: 5,
    fetchFrequencyMinutes: 3,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:42:00',
    articlesCountToday: 380,
  },
  {
    id: 'src-3',
    name: 'جوجل نيوز (Google News)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
    url: 'https://news.google.com/rss?hl=ar&gl=SA&ceid=SA:ar',
    type: 'Google_News',
    category: 'الكل',
    country: 'السعودية',
    language: 'ar',
    priority: 'High',
    reliabilityRating: 5,
    fetchFrequencyMinutes: 5,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:44:00',
    articlesCountToday: 512,
  },
  {
    id: 'src-4',
    name: 'محرك NewsAPI العالمي',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=100&q=80',
    url: 'https://newsapi.org/v2/top-headlines',
    type: 'NewsAPI',
    category: 'تكنولوجيا',
    country: 'عالمي',
    language: 'en',
    priority: 'High',
    reliabilityRating: 5,
    fetchFrequencyMinutes: 5,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:39:00',
    articlesCountToday: 420,
    apiKey: 'demo-newsapi-key-90',
  },
  {
    id: 'src-5',
    name: 'شبكة GNews الشرق الأوسط',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
    url: 'https://gnews.io/api/v4/top-headlines',
    type: 'GNews',
    category: 'اقتصاد',
    country: 'الإمارات',
    language: 'ar',
    priority: 'Medium',
    reliabilityRating: 4,
    fetchFrequencyMinutes: 5,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:35:00',
    articlesCountToday: 180,
    apiKey: 'demo-gnews-key-90',
  },
  {
    id: 'src-6',
    name: 'منصة Mediastack',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=100&q=80',
    url: 'http://api.mediastack.com/v1/news',
    type: 'Mediastack',
    category: 'علوم',
    country: 'عالمي',
    language: 'en',
    priority: 'Medium',
    reliabilityRating: 4,
    fetchFrequencyMinutes: 10,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:20:00',
    articlesCountToday: 240,
    apiKey: 'demo-mediastack-key-90',
  },
  {
    id: 'src-7',
    name: 'شبكة NewsData.io',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
    url: 'https://newsdata.io/api/1/news',
    type: 'NewsData_io',
    category: 'سياسة',
    country: 'الكويت',
    language: 'ar',
    priority: 'Medium',
    reliabilityRating: 4,
    fetchFrequencyMinutes: 5,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:30:00',
    articlesCountToday: 195,
  },
  {
    id: 'src-8',
    name: 'صحيفة الجارديان (The Guardian)',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=100&q=80',
    url: 'https://content.guardianapis.com/search',
    type: 'Guardian',
    category: 'تكنولوجيا',
    country: 'بريطانيا',
    language: 'en',
    priority: 'High',
    reliabilityRating: 5,
    fetchFrequencyMinutes: 5,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:41:00',
    articlesCountToday: 310,
  },
  {
    id: 'src-9',
    name: 'نيويورك تايمز (NYT)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
    url: 'https://api.nytimes.com/svc/topstories/v2/home.json',
    type: 'NYT',
    category: 'علوم',
    country: 'أمريكا',
    language: 'en',
    priority: 'High',
    reliabilityRating: 5,
    fetchFrequencyMinutes: 10,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:25:00',
    articlesCountToday: 150,
  },
  {
    id: 'src-10',
    name: 'بي بي سي عربي (BBC Arabic)',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=100&q=80',
    url: 'https://bbc.com/arabic/index.xml',
    type: 'BBC',
    category: 'سياسة',
    country: 'عالمي',
    language: 'ar',
    priority: 'High',
    reliabilityRating: 5,
    fetchFrequencyMinutes: 5,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:30:00',
    articlesCountToday: 98,
  },
  {
    id: 'src-11',
    name: 'سي إن إن بالعربية (CNN Arabic)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
    url: 'https://arabic.cnn.com/rss/cnnarabic_world.rss',
    type: 'CNN',
    category: 'سياسة',
    country: 'عالمي',
    language: 'ar',
    priority: 'High',
    reliabilityRating: 5,
    fetchFrequencyMinutes: 5,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:43:00',
    articlesCountToday: 230,
  },
  {
    id: 'src-12',
    name: 'الجزيرة نت (Al Jazeera)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
    url: 'https://aljazeera.net/rss',
    type: 'AlJazeera',
    category: 'سياسة',
    country: 'قطر',
    language: 'ar',
    priority: 'High',
    reliabilityRating: 4,
    fetchFrequencyMinutes: 5,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:41:00',
    articlesCountToday: 290,
  },
  {
    id: 'src-13',
    name: 'شبكة العربية الإخبارية (Al Arabiya)',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=100&q=80',
    url: 'https://alarabiya.net/api/v1/latest.json',
    type: 'AlArabiya',
    category: 'سياسة',
    country: 'السعودية',
    language: 'ar',
    priority: 'High',
    reliabilityRating: 5,
    fetchFrequencyMinutes: 3,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:44:00',
    articlesCountToday: 340,
  },
  {
    id: 'src-14',
    name: 'سكاي نيوز عربية (Sky News Arabia)',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
    url: 'https://skynewsarabia.com/api/v1/news',
    type: 'SkyNews',
    category: 'عاجل',
    country: 'الإمارات',
    language: 'ar',
    priority: 'High',
    reliabilityRating: 5,
    fetchFrequencyMinutes: 3,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:45:00',
    articlesCountToday: 410,
  },
  {
    id: 'src-15',
    name: 'يلا كورة الرياضية',
    logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=100&q=80',
    url: 'https://yallakora.com/rss',
    type: 'Scraper',
    category: 'رياضة',
    country: 'مصر',
    language: 'ar',
    priority: 'Low',
    reliabilityRating: 4,
    fetchFrequencyMinutes: 10,
    status: 'Active',
    lastFetchedAt: '2026-08-07 13:20:00',
    articlesCountToday: 65,
  },
];

export class SourcesRepository extends BaseRepository<NewsSource> {
  constructor() {
    super('safara90_news_sources_v2');
    this.seedIfEmpty();
  }

  private seedIfEmpty(): void {
    // Disabled seeding mock sources for production
  }

  public getActiveSources(): NewsSource[] {
    return this.getStoredItems().filter((s) => s.status === 'Active');
  }

  public toggleSourceStatus(id: string): NewsSource | null {
    const source = this.getById(id);
    if (source) {
      const nextStatus = source.status === 'Active' ? 'Paused' : 'Active';
      return this.update(id, { status: nextStatus });
    }
    return null;
  }

  public updateLastFetched(id: string, countAdded: number = 0): void {
    const source = this.getById(id);
    if (source) {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      this.update(id, {
        lastFetchedAt: now,
        articlesCountToday: source.articlesCountToday + countAdded,
        status: 'Active',
      });
    }
  }

  public setSourceError(id: string): void {
    this.update(id, { status: 'Error' });
  }
}

export const sourcesRepository = new SourcesRepository();
