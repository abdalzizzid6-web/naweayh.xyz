import { BaseRepository } from './baseRepository';

export interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  role: 'Executive' | 'Editor-in-Chief' | 'Operations Lead' | 'AI Specialist' | 'Auditor' | 'System Admin';
  status: 'Active' | 'Suspended' | 'Pending';
  lastLogin: string;
  department: string;
  avatar: string;
}

export interface EnterpriseSource {
  id: string;
  name: string;
  url: string;
  type: 'RSS Feed' | 'REST API' | 'Web Scraper' | 'Direct Wire';
  status: 'Active' | 'Warning' | 'Error' | 'Paused';
  trustScore: number;
  lastFetch: string;
  articlesCount: number;
  country: string;
}

export interface EnterpriseCountry {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  activeSources: number;
  status: 'Active' | 'Disabled';
  region: 'GCC' | 'Middle East' | 'North Africa' | 'Global';
}

export interface EnterpriseLanguage {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  dir: 'rtl' | 'ltr';
  isDefault: boolean;
  status: 'Active' | 'Beta' | 'Disabled';
  aiEngine: string;
}

export interface EnterpriseAdUnit {
  id: string;
  name: string;
  placement: 'Header Banner' | 'In-Article Native' | 'Sidebar Sticky' | 'Footer Sticky' | 'Interstitials';
  provider: 'Google AdSense' | 'Google AdX' | 'Direct Sponsor' | 'Prebid Native';
  ecpm: number;
  status: 'Active' | 'Paused' | 'Testing';
  monthlyImpressions: number;
  estimatedRevenueUSD: number;
}

export type EnterpriseAd = {
  id: string;
  title: string;
  placement: string;
  impressions: number;
  clicks: number;
  status: 'Active' | 'Paused';
};

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  timestamp: string;
  status: 'Success' | 'Warning' | 'Failed';
}

export interface EnterpriseAIConfig {
  primaryModel: string;
  secondaryModel: string;
  autoSummarize: boolean;
  autoEntities: boolean;
  autoTranslate: boolean;
  sentimentAnalysis: boolean;
  temperature: number;
  maxOutputTokens: number;
  safetyThreshold: 'BLOCK_NONE' | 'BLOCK_LOW' | 'BLOCK_MEDIUM' | 'BLOCK_HIGH';
  autoPublishThresholdScore: number;
}

export interface EnterpriseSEOConfig {
  autoSitemapXML: boolean;
  googleNewsFeed: boolean;
  canonicalDomain: string;
  ampPages: boolean;
  structuredDataJsonLd: boolean;
  robotsTxtCustom: string;
  googleDiscoverOptimization: boolean;
}

export interface EnterpriseBackup {
  id: string;
  filename: string;
  sizeMB: number;
  createdAt: string;
  type: 'Full System' | 'Database Snapshot' | 'Media Library';
  status: 'Completed' | 'Restoring' | 'Failed';
  downloadUrl: string;
}

export interface EnterpriseAPIKey {
  id: string;
  name: string;
  service: 'Gemini AI Pro' | 'Firebase Admin' | 'Twitter/X OAuth' | 'WhatsApp Business' | 'Google Maps';
  keyMasked: string;
  status: 'Active' | 'Expired' | 'Revoked';
  createdDate: string;
  monthlyCalls: number;
  quotaLimit: number;
}

export interface EnterpriseSystemSetting {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  defaultLanguage: string;
  cdnCaching: boolean;
  maxUploadMB: number;
  autoArchiveDays: number;
  debugMode: boolean;
  enforceMFA: boolean;
}

export interface EnterpriseCronJob {
  id: string;
  name: string;
  cronExpr: string;
  taskDescription: string;
  status: 'Running' | 'Idle' | 'Failed' | 'Paused';
  lastRun: string;
  nextRun: string;
  avgDurationMs: number;
}

export interface EnterpriseQueue {
  id: string;
  name: string;
  pendingJobs: number;
  processingJobs: number;
  completedToday: number;
  failedToday: number;
  workerThreads: number;
  status: 'Healthy' | 'High Load' | 'Paused';
}

export interface EnterpriseRolePermission {
  role: string;
  permissions: { [permissionId: string]: boolean };
}

class EnterpriseAdminRepository extends BaseRepository<any> {
  protected storageKey = 'naw3iya_enterprise_admin_v1';

  constructor() {
    super('naw3iya_enterprise_admin_v1');
  }

  private users: EnterpriseUser[] = [
    {
      id: 'USR-101',
      name: 'عبد العزيز الزيد',
      email: 'abdalzizzid6@gmail.com',
      role: 'Executive',
      status: 'Active',
      lastLogin: 'منذ 5 دقائق',
      department: 'الإدارة العليا والتخطيط',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      id: 'USR-102',
      name: 'سارة الشمري',
      email: 'sara.shammari@naweayh.xyz',
      role: 'Editor-in-Chief',
      status: 'Active',
      lastLogin: 'منذ ساعة',
      department: 'تحرير الأخبار والتغطيات',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      id: 'USR-103',
      name: 'د. خالد العمري',
      email: 'khalid.omari@naweayh.xyz',
      role: 'AI Specialist',
      status: 'Active',
      lastLogin: 'منذ ساعتين',
      department: 'تطوير نماذج الذكاء الاصطناعي',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      id: 'USR-104',
      name: 'مهندس عمر بن فيصل',
      email: 'omar.faisal@naweayh.xyz',
      role: 'System Admin',
      status: 'Active',
      lastLogin: 'الآن',
      department: 'البنية التحتية والأمان',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
    {
      id: 'USR-105',
      name: 'منيرة العتيبي',
      email: 'monira.otaibi@naweayh.xyz',
      role: 'Operations Lead',
      status: 'Active',
      lastLogin: 'منذ يوم',
      department: 'العمليات والتوزيع الإخباري',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  ];

  private sources: EnterpriseSource[] = [
    {
      id: 'SRC-201',
      name: 'وكالة الأنباء السعودية (واس)',
      url: 'https://www.spa.gov.sa/rss',
      type: 'RSS Feed',
      status: 'Active',
      trustScore: 99,
      lastFetch: 'منذ 2 دقيقة',
      articlesCount: 1420,
      country: 'المملكة العربية السعودية',
    },
    {
      id: 'SRC-202',
      name: 'وكالة أنباء الإمارات (وام)',
      url: 'https://wam.ae/ar/rss',
      type: 'RSS Feed',
      status: 'Active',
      trustScore: 98,
      lastFetch: 'منذ 5 دقائق',
      articlesCount: 980,
      country: 'الإمارات العربية المتحدة',
    },
    {
      id: 'SRC-203',
      name: 'رويترز الشرق الأوسط (Reuters AR)',
      url: 'https://api.reuters.com/v2/news/middleeast',
      type: 'REST API',
      status: 'Active',
      trustScore: 97,
      lastFetch: 'منذ دقيقة',
      articlesCount: 2300,
      country: 'عالمي',
    },
    {
      id: 'SRC-204',
      name: 'بلومبرغ الشرق الأوسط (Bloomberg Asharq)',
      url: 'https://asharq.com/rss',
      type: 'RSS Feed',
      status: 'Active',
      trustScore: 96,
      lastFetch: 'منذ 10 دقائق',
      articlesCount: 1150,
      country: 'عالمي',
    },
  ];

  private countries: EnterpriseCountry[] = [
    { id: 'C-01', code: 'SA', nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia', flag: '🇸🇦', activeSources: 18, status: 'Active', region: 'GCC' },
    { id: 'C-02', code: 'AE', nameAr: 'الإمارات العربية المتحدة', nameEn: 'United Arab Emirates', flag: '🇦🇪', activeSources: 12, status: 'Active', region: 'GCC' },
    { id: 'C-03', code: 'EG', nameAr: 'جمهورية مصر العربية', nameEn: 'Egypt', flag: '🇪🇬', activeSources: 10, status: 'Active', region: 'North Africa' },
    { id: 'C-04', code: 'QA', nameAr: 'دولة قطر', nameEn: 'Qatar', flag: '🇶🇦', activeSources: 8, status: 'Active', region: 'GCC' },
    { id: 'C-05', code: 'US', nameAr: 'الولايات المتحدة الأمريكية', nameEn: 'United States', flag: '🇺🇸', activeSources: 15, status: 'Active', region: 'Global' },
  ];

  private languages: EnterpriseLanguage[] = [
    { id: 'L-01', code: 'ar', nameAr: 'العربية (المعيارية الرسمية)', nameEn: 'Arabic', dir: 'rtl', isDefault: true, status: 'Active', aiEngine: 'Gemini 2.5 Pro Arabic Native' },
    { id: 'L-02', code: 'en', nameAr: 'الإنكليزية (Global English)', nameEn: 'English', dir: 'ltr', isDefault: false, status: 'Active', aiEngine: 'Gemini 2.5 Flash Ultra' },
    { id: 'L-03', code: 'fr', nameAr: 'الفرنسية (French)', nameEn: 'French', dir: 'ltr', isDefault: false, status: 'Active', aiEngine: 'Gemini Multilingual' },
    { id: 'L-04', code: 'zh', nameAr: 'الصينية (Mandarin)', nameEn: 'Chinese', dir: 'ltr', isDefault: false, status: 'Beta', aiEngine: 'Gemini Multilingual' },
  ];

  private ads: EnterpriseAdUnit[] = [
    { id: 'AD-101', name: 'إعلان أعلى الهيدر (Header Leaderboard)', placement: 'Header Banner', provider: 'Google AdX', ecpm: 4.85, status: 'Active', monthlyImpressions: 450000, estimatedRevenueUSD: 2182.5 },
    { id: 'AD-102', name: 'إعلان داخل مقال الخبراء (Native Feed)', placement: 'In-Article Native', provider: 'Prebid Native', ecpm: 6.20, status: 'Active', monthlyImpressions: 890000, estimatedRevenueUSD: 5518.0 },
    { id: 'AD-103', name: 'إعلان الشريط الجانبي (Sidebar Banner)', placement: 'Sidebar Sticky', provider: 'Google AdSense', ecpm: 3.10, status: 'Active', monthlyImpressions: 320000, estimatedRevenueUSD: 992.0 },
    { id: 'AD-104', name: 'إعلان شريط القاع اللزج (Footer Banner)', placement: 'Footer Sticky', provider: 'Direct Sponsor', ecpm: 8.50, status: 'Active', monthlyImpressions: 210000, estimatedRevenueUSD: 1785.0 },
  ];

  private aiConfig: EnterpriseAIConfig = {
    primaryModel: 'gemini-3.6-flash',
    secondaryModel: 'gemini-3.1-pro-preview',
    autoSummarize: true,
    autoEntities: true,
    autoTranslate: true,
    sentimentAnalysis: true,
    temperature: 0.2,
    maxOutputTokens: 2048,
    safetyThreshold: 'BLOCK_MEDIUM',
    autoPublishThresholdScore: 92,
  };

  private seoConfig: EnterpriseSEOConfig = {
    autoSitemapXML: true,
    googleNewsFeed: true,
    canonicalDomain: 'https://naweayh.xyz',
    ampPages: true,
    structuredDataJsonLd: true,
    robotsTxtCustom: 'User-agent: *\nAllow: /\nSitemap: https://naweayh.xyz/sitemap.xml',
    googleDiscoverOptimization: true,
  };

  private backups: EnterpriseBackup[] = [
    { id: 'BK-901', filename: 'naw3iya_full_backup_2026_08_07.tar.gz', sizeMB: 480, createdAt: '2026-08-07 02:00:00', type: 'Full System', status: 'Completed', downloadUrl: '#' },
    { id: 'BK-900', filename: 'naw3iya_db_snapshot_2026_08_06.sql', sizeMB: 125, createdAt: '2026-08-06 02:00:00', type: 'Database Snapshot', status: 'Completed', downloadUrl: '#' },
    { id: 'BK-899', filename: 'naw3iya_db_snapshot_2026_08_05.sql', sizeMB: 121, createdAt: '2026-08-05 02:00:00', type: 'Database Snapshot', status: 'Completed', downloadUrl: '#' },
  ];

  private apiKeys: EnterpriseAPIKey[] = [
    { id: 'KEY-01', name: 'Gemini AI Studio Engine Key', service: 'Gemini AI Pro', keyMasked: 'AIzaSyD...9Xk2L', status: 'Active', createdDate: '2026-01-10', monthlyCalls: 184500, quotaLimit: 1000000 },
    { id: 'KEY-02', name: 'Firebase Service Account Credentials', service: 'Firebase Admin', keyMasked: 'firebase-adminsdk-3...json', status: 'Active', createdDate: '2026-01-12', monthlyCalls: 540200, quotaLimit: 5000000 },
    { id: 'KEY-03', name: 'Twitter/X Enterprise Publisher Key', service: 'Twitter/X OAuth', keyMasked: 'tw_ent_884930...01x', status: 'Active', createdDate: '2026-02-01', monthlyCalls: 12500, quotaLimit: 50000 },
    { id: 'KEY-04', name: 'WhatsApp Business Cloud API', service: 'WhatsApp Business', keyMasked: 'EAAG129...xK90', status: 'Active', createdDate: '2026-03-15', monthlyCalls: 89000, quotaLimit: 200000 },
  ];

  private systemSettings: EnterpriseSystemSetting = {
    siteName: 'أخبار نوعية — Naw3iya News',
    siteDescription: 'أخبار نوعية — المنصة الإخبارية الذكية الشاملة: الأخبار كما تستحق أن تُقرأ.',
    maintenanceMode: false,
    defaultLanguage: 'ar',
    cdnCaching: true,
    maxUploadMB: 50,
    autoArchiveDays: 365,
    debugMode: false,
    enforceMFA: true,
  };

  private cronJobs: EnterpriseCronJob[] = [
    { id: 'CRON-01', name: 'مزامنة خلاصات RSS والمصادر', cronExpr: '*/5 * * * *', taskDescription: 'جلب الأخبار الجديدة وتغذية خادم المعالجة بانتظام كل 5 دقائق', status: 'Running', lastRun: 'منذ 2 دقيقة', nextRun: 'بعد 3 دقائق', avgDurationMs: 1420 },
    { id: 'CRON-02', name: 'التحليل التلقائي بـ Gemini AI', cronExpr: '*/10 * * * *', taskDescription: 'استخراج الكيانات والوسوم والملخص الفوري للأخبار غير المعالجة', status: 'Running', lastRun: 'منذ 6 دقائق', nextRun: 'بعد 4 دقائق', avgDurationMs: 2890 },
    { id: 'CRON-03', name: 'تحديث خرائط Google News Sitemaps', cronExpr: '0 * * * *', taskDescription: 'إعادة توليد sitemap-news.xml وتحديث السجلات كل ساعة', status: 'Running', lastRun: 'منذ 45 دقيقة', nextRun: 'بعد 15 دقيقة', avgDurationMs: 650 },
    { id: 'CRON-04', name: 'النسخ الاحتياطي لقواعد البيانات', cronExpr: '0 2 * * *', taskDescription: 'إنشاء لقطة مشفرة لكامل البيانات عند الساعة 02:00 صباحاً', status: 'Idle', lastRun: 'منذ 5 ساعات', nextRun: 'غداً 02:00', avgDurationMs: 18400 },
  ];

  private queues: EnterpriseQueue[] = [
    { id: 'Q-01', name: 'طابور معالجة الذكاء الاصطناعي (AI Processing Pipeline)', pendingJobs: 4, processingJobs: 2, completedToday: 1840, failedToday: 2, workerThreads: 8, status: 'Healthy' },
    { id: 'Q-02', name: 'طابور إرسال الإشعارات الفورية (Push Notification Queue)', pendingJobs: 0, processingJobs: 0, completedToday: 89000, failedToday: 12, workerThreads: 16, status: 'Healthy' },
    { id: 'Q-03', name: 'طابور ضغط ومعالجة الصور (Media Compression Queue)', pendingJobs: 1, processingJobs: 1, completedToday: 320, failedToday: 0, workerThreads: 4, status: 'Healthy' },
    { id: 'Q-04', name: 'طابور النشر الآلي للتواصل الاجتماعي (Social Dispatcher)', pendingJobs: 2, processingJobs: 1, completedToday: 410, failedToday: 1, workerThreads: 4, status: 'Healthy' },
  ];

  private rolePermissions: { [role: string]: { [perm: string]: boolean } } = {
    Executive: {
      manage_articles: true,
      manage_sources: true,
      manage_users: true,
      manage_ads: true,
      manage_ai: true,
      manage_seo: true,
      manage_backups: true,
      manage_api_keys: true,
      manage_settings: true,
    },
    'System Admin': {
      manage_articles: true,
      manage_sources: true,
      manage_users: true,
      manage_ads: true,
      manage_ai: true,
      manage_seo: true,
      manage_backups: true,
      manage_api_keys: true,
      manage_settings: true,
    },
    'Editor-in-Chief': {
      manage_articles: true,
      manage_sources: true,
      manage_users: false,
      manage_ads: false,
      manage_ai: true,
      manage_seo: true,
      manage_backups: false,
      manage_api_keys: false,
      manage_settings: false,
    },
    'Operations Lead': {
      manage_articles: true,
      manage_sources: true,
      manage_users: false,
      manage_ads: true,
      manage_ai: false,
      manage_seo: false,
      manage_backups: false,
      manage_api_keys: false,
      manage_settings: false,
    },
    Auditor: {
      manage_articles: false,
      manage_sources: false,
      manage_users: false,
      manage_ads: false,
      manage_ai: false,
      manage_seo: false,
      manage_backups: false,
      manage_api_keys: false,
      manage_settings: false,
    },
  };

  public getUsers() {
    return this.users;
  }

  public addUser(user: Omit<EnterpriseUser, 'id'>) {
    const newUser: EnterpriseUser = {
      ...user,
      id: `USR-${Date.now().toString().slice(-4)}`,
    };
    this.users.unshift(newUser);
    return newUser;
  }

  public updateUserStatus(id: string, status: EnterpriseUser['status']) {
    const u = this.users.find((x) => x.id === id);
    if (u) u.status = status;
  }

  public getSources() {
    return this.sources;
  }

  public addSource(source: Omit<EnterpriseSource, 'id'>) {
    const newSource: EnterpriseSource = {
      ...source,
      id: `SRC-${Date.now().toString().slice(-4)}`,
    };
    this.sources.unshift(newSource);
    return newSource;
  }

  public updateSourceStatus(id: string, status: EnterpriseSource['status']) {
    const s = this.sources.find((x) => x.id === id);
    if (s) s.status = status;
  }

  public toggleSourceStatus(id: string) {
    const s = this.sources.find((x) => x.id === id);
    if (s) {
      s.status = s.status === 'Active' ? 'Paused' : 'Active';
    }
  }

  public getAuditLogs(): AuditLog[] {
    return [
      { id: 'log-1', user: 'عبد العزيز الزيد', role: 'Executive', action: 'إنشاء خبر جديد بمحرر AI', entity: 'أخبار القمة التقنية', timestamp: 'منذ دقيقتين', status: 'Success' },
      { id: 'log-2', user: 'سارة الشمري', role: 'Editor-in-Chief', action: 'إصدار تنبيه عاجل', entity: 'خبر طارئ', timestamp: 'منذ 10 دقائق', status: 'Success' },
      { id: 'log-3', user: 'مهندس عمر بن فيصل', role: 'System Admin', action: 'اختبار استجابة المصادر', entity: 'SPA RSS Feed', timestamp: 'منذ نصف ساعة', status: 'Success' },
    ];
  }

  public getCountries() {
    return this.countries;
  }

  public toggleCountryStatus(id: string) {
    const c = this.countries.find((x) => x.id === id);
    if (c) c.status = c.status === 'Active' ? 'Disabled' : 'Active';
  }

  public getLanguages() {
    return this.languages;
  }

  public toggleLanguageStatus(id: string) {
    const l = this.languages.find((x) => x.id === id);
    if (l) l.status = l.status === 'Active' ? 'Disabled' : 'Active';
  }

  public getAds() {
    return this.ads;
  }

  public toggleAdStatus(id: string) {
    const a = this.ads.find((x) => x.id === id);
    if (a) a.status = a.status === 'Active' ? 'Paused' : 'Active';
  }

  public getAIConfig() {
    return this.aiConfig;
  }

  public updateAIConfig(updates: Partial<EnterpriseAIConfig>) {
    this.aiConfig = { ...this.aiConfig, ...updates };
    return this.aiConfig;
  }

  public getSEOConfig() {
    return this.seoConfig;
  }

  public updateSEOConfig(updates: Partial<EnterpriseSEOConfig>) {
    this.seoConfig = { ...this.seoConfig, ...updates };
    return this.seoConfig;
  }

  public getBackups() {
    return this.backups;
  }

  public createManualBackup() {
    const newBk: EnterpriseBackup = {
      id: `BK-${Date.now().toString().slice(-4)}`,
      filename: `naw3iya_manual_snapshot_${new Date().toISOString().slice(0, 10)}.sql`,
      sizeMB: Math.floor(Math.random() * 50) + 120,
      createdAt: new Date().toLocaleString('ar-SA'),
      type: 'Database Snapshot',
      status: 'Completed',
      downloadUrl: '#',
    };
    this.backups.unshift(newBk);
    return newBk;
  }

  public getAPIKeys() {
    return this.apiKeys;
  }

  public createAPIKey(name: string, service: EnterpriseAPIKey['service']) {
    const newKey: EnterpriseAPIKey = {
      id: `KEY-${Date.now().toString().slice(-4)}`,
      name,
      service,
      keyMasked: `naw3iya_live_${Math.random().toString(36).substring(2, 10)}...sec`,
      status: 'Active',
      createdDate: new Date().toISOString().slice(0, 10),
      monthlyCalls: 0,
      quotaLimit: 500000,
    };
    this.apiKeys.unshift(newKey);
    return newKey;
  }

  public revokeAPIKey(id: string) {
    const k = this.apiKeys.find((x) => x.id === id);
    if (k) k.status = 'Revoked';
  }

  public getSystemSettings() {
    return this.systemSettings;
  }

  public updateSystemSettings(updates: Partial<EnterpriseSystemSetting>) {
    this.systemSettings = { ...this.systemSettings, ...updates };
    return this.systemSettings;
  }

  public getCronJobs() {
    return this.cronJobs;
  }

  public toggleCronStatus(id: string) {
    const c = this.cronJobs.find((x) => x.id === id);
    if (c) c.status = c.status === 'Running' ? 'Paused' : 'Running';
  }

  public getQueues() {
    return this.queues;
  }

  public purgeQueue(id: string) {
    const q = this.queues.find((x) => x.id === id);
    if (q) {
      q.pendingJobs = 0;
      q.processingJobs = 0;
    }
  }

  public getPermissionsForRole(role: string) {
    return this.rolePermissions[role] || {};
  }

  public updatePermission(role: string, permKey: string, value: boolean) {
    if (!this.rolePermissions[role]) {
      this.rolePermissions[role] = {};
    }
    this.rolePermissions[role][permKey] = value;
  }
}

export const enterpriseAdminRepository = new EnterpriseAdminRepository();
