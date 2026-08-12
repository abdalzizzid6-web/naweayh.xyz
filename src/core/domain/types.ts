export type UserRole = 'Executive' | 'Operations Lead' | 'Auditor' | 'System Admin' | 'Editor' | 'Reader';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  favoriteCategories?: string[];
  favoriteCountries?: string[];
  favoriteSources?: string[];
  savedArticleIds?: string[];
  notificationSettings?: {
    breakingNews: boolean;
    dailyDigest: boolean;
    topicAlerts: boolean;
  };
}

export interface MetricItem {
  id: string;
  label: string;
  value: string | number;
  changePercent: number;
  isPositive: boolean;
  period: string;
  category: 'Financial' | 'Operations' | 'Resource' | 'Security' | 'Audience';
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'Under Review' | 'Completed' | 'On Hold';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TaskItem {
  id: string;
  title: string;
  assignedTo: string;
  completed: boolean;
  dueDate: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  owner: string;
  budget: number;
  spent: number;
  progress: number;
  startDate: string;
  targetCompletion: string;
  tags: string[];
  tasks: TaskItem[];
}

export interface ArticleSourceInfo {
  id: string;
  name: string;
  logo: string;
  url: string;
  publishedAt: string;
  reliabilityScore: number;
  isPrimary: boolean;
}

export interface AIArticleEntities {
  people: string[];
  organizations: string[];
  locations: string[];
  countries?: string[];
  cities?: string[];
  events?: string[];
  keywords?: string[];
  tags: string[];
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  trustScore: number;
  detectedLanguage?: string;
  paraphrasedSummary?: string;
  cleanedContent?: string;
  catchyTitle?: string;
  relatedArticleIds?: string[];
}

export interface SEOMeta {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  schemaType: string;
  openGraphImage: string;
}

export type SocialPlatform =
  | 'Facebook'
  | 'Instagram'
  | 'X'
  | 'Telegram'
  | 'WhatsApp'
  | 'LinkedIn'
  | 'Threads'
  | 'Pinterest'
  | 'Bluesky';

export interface SocialPostStatus {
  platform: SocialPlatform;
  status: 'Published' | 'Scheduled' | 'Pending' | 'Failed';
  publishedAt?: string;
  postUrl?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  mainImage: string;
  galleryImages: string[];
  category: string;
  subCategory?: string;
  country: string;
  author?: string;
  language: 'ar' | 'en';
  publishDate: string;
  updatedAt: string;
  readTimeMinutes: number;
  viewsCount: number;
  sharesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  isBreaking: boolean;
  isTrending: boolean;
  isEditorPick: boolean;
  isBookmarked?: boolean;
  trustScore: number;
  sources: ArticleSourceInfo[];
  aiEntities: AIArticleEntities;
  seoMeta: SEOMeta;
  seoTitle?: string;
  metaDescription?: string;
  videoUrl?: string;
  embeddedVideos?: string[];
  paragraphs?: string[];
  formattedBody?: string;
  isFullContentAvailable?: boolean;
  copyrightNotice?: string;
  originalArticleUrl?: string;
  socialPosts: SocialPostStatus[];
}

export type NewsSourceProtocol =
  | 'RSS'
  | 'Atom'
  | 'XML'
  | 'JSON'
  | 'REST_API'
  | 'Google_News'
  | 'NewsAPI'
  | 'GNews'
  | 'Mediastack'
  | 'NewsData_io'
  | 'Guardian'
  | 'NYT'
  | 'Reuters'
  | 'BBC'
  | 'CNN'
  | 'AlJazeera'
  | 'AlArabiya'
  | 'SkyNews'
  | 'Scraper';

export interface NewsSource {
  id: string;
  name: string;
  logo: string;
  url: string;
  feedUrl?: string;
  type: NewsSourceProtocol;
  category: string;
  country: string;
  language: 'ar' | 'en' | string;
  priority: 'High' | 'Medium' | 'Low';
  reliabilityRating: number;
  trustScore?: number;
  fetchFrequencyMinutes: number;
  status: 'Active' | 'Paused' | 'Error';
  lastFetchedAt: string;
  articlesCountToday: number;
  apiKey?: string;
  endpointParams?: Record<string, string>;
}

export interface SocialChannelConfig {
  id: string;
  platform: SocialPlatform;
  channelName: string;
  accountHandle: string;
  accountAvatar: string;
  enabled: boolean;
  autoPublishCategories: string[];
  autoPublishSources: string[];
  autoPublishCountries: string[];
  template: string;
  defaultHashtags: string[];
  scheduleDelayMinutes: number;
  totalPublished: number;
}

export interface SocialPostItem {
  id: string;
  articleId: string;
  articleTitle: string;
  articleSummary: string;
  articleImage: string;
  articleUrl: string;
  category: string;
  sourceName: string;
  country: string;
  platform: SocialPlatform;
  formattedContent: string;
  hashtags: string[];
  status: 'Published' | 'Scheduled' | 'Queued' | 'Failed';
  scheduledAt: string;
  publishedAt?: string;
  republishCount: number;
  engagement: {
    views: number;
    likes: number;
    shares: number;
    clicks: number;
  };
}

export interface AdPlacement {
  id: string;
  name: string;
  type: 'Banner' | 'Native' | 'Interstitial' | 'InArticle' | 'Rewarded';
  provider: 'Google Ad Manager' | 'AdMob' | 'Custom Direct';
  status: 'Active' | 'Disabled';
  impressions: number;
  clicks: number;
  estimatedRevenueUSD: number;
}

export type NotificationProvider = 'Firebase_FCM' | 'OneSignal' | 'Hybrid_Dual';

export type NotificationTargetType =
  | 'ALL'
  | 'BREAKING_SUBSCRIBERS'
  | 'CATEGORY'
  | 'COUNTRY'
  | 'INTEREST'
  | 'PERSONALIZED_SEGMENT';

export type NotificationPriority = 'Urgent_Breaking' | 'High' | 'Normal';

export interface ABTestVariant {
  variantId: 'A' | 'B';
  title: string;
  body: string;
  deliveryCount: number;
  openCount: number;
  clickCount: number;
  openRatePercent: number;
  ctrPercent: number;
}

export interface ABTestConfig {
  enabled: boolean;
  variantA: ABTestVariant;
  variantB: ABTestVariant;
  splitRatioPercent: number;
  winningVariant?: 'A' | 'B' | 'Pending';
  autoSelectWinnerAfterHours?: number;
}

export interface PushNotificationCampaign {
  id: string;
  title: string;
  body: string;
  articleId?: string;
  articleUrl?: string;
  imageUrl?: string;
  provider: NotificationProvider;
  targetType: NotificationTargetType;
  targetAudience: string;
  targetValue?: string;
  priority: NotificationPriority;
  status: 'Sent' | 'Scheduled' | 'Draft' | 'Sending' | 'Cancelled';
  scheduledAt?: string;
  sentAt?: string;
  deliveryCount: number;
  fcmSentCount: number;
  oneSignalSentCount: number;
  openRatePercent: number;
  clickCount: number;
  isABTest?: boolean;
  abTestConfig?: ABTestConfig;
  personalizedData?: {
    userSegment?: string;
    preferredCategories?: string[];
    userLanguage?: string;
  };
}

export interface NotificationProviderConfig {
  fcm: {
    enabled: boolean;
    serverKeyConfigured: boolean;
    projectId: string;
    activeTokensCount: number;
    status: 'Connected' | 'Disconnected' | 'Testing';
  };
  oneSignal: {
    enabled: boolean;
    appIdConfigured: boolean;
    appId: string;
    activePlayersCount: number;
    status: 'Connected' | 'Disconnected' | 'Testing';
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  details: string;
  ipAddress: string;
  status: 'Success' | 'Warning' | 'Failed';
}

export interface SprintReport {
  sprintId: string;
  title: string;
  completedDate: string;
  passedBuild: boolean;
  passedTypeScript: boolean;
  passedESLint: boolean;
  summary: string;
  metrics: {
    featuresDelivered: number;
    bugsFixed: number;
    codeQualityScore: number;
    performanceIndex: number;
  };
}

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  activeSessions: number;
  apiLatencyMs: number;
  status: 'Optimal' | 'Degraded' | 'Critical';
  redisHitRatePercent: number;
  databaseConnections: number;
  totalArticlesInCluster: number;
}

export interface RedisCacheMetrics {
  totalKeys: number;
  memoryUsedMB: number;
  hitRatePercent: number;
  evictionPolicy: 'allkeys-lru' | 'volatile-lru' | 'noeviction';
  clusterNodes: number;
  queriesPerSecond: number;
}

export interface CDNEdgeNode {
  city: string;
  country: string;
  latencyMs: number;
  cacheHitPercent: number;
  http3Enabled: boolean;
  status: 'Active' | 'Optimized' | 'Bypassed';
}

export interface ImageOptimizationConfig {
  defaultFormat: 'AVIF' | 'WebP' | 'JPEG';
  qualityPercent: number;
  autoResizeWidths: number[];
  blurPlaceholderEnabled: boolean;
  lazyLoadNative: boolean;
  cdnImageProxyDomain: string;
}

export interface PWAServiceWorkerConfig {
  registered: boolean;
  offlineStorageMB: number;
  cachedArticlesCount: number;
  backgroundSyncPending: number;
  http3Support: boolean;
  brotliCompression: boolean;
  staleWhileRevalidateEnabled: boolean;
}

export interface DatabaseIndexOptimizerConfig {
  totalPartitionedRecords: number; // e.g. 10,250,000
  activeCompositeIndexes: number;
  avgQueryExecutionMs: number;
  cursorPaginationEnabled: boolean;
  readReplicasCount: number;
  pgBouncerPoolSize: number;
}

