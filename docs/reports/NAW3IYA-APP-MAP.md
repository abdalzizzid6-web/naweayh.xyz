# NAW3IYA NEWS — APPLICATION MAP & ROUTING ARCHITECTURE

**Document ID:** `NAW3IYA-APP-MAP`  
**Platform:** أخبار نوعية — Naw3iya News (naweayh.xyz)  
**Version:** v2.6.0 Enterprise Rescue Edition  

---

## 1. PUBLIC PORTAL ROUTES & VIEWS

| Path / Slug | Component Name | Purpose & Description | Data Source |
| :--- | :--- | :--- | :--- |
| `/` | `PortalView` | Master Editorial Homepage (Breaking, Hero Story, Latest, Trending, Most Read, Categories, Regions) | `/api/v1/news`, `/api/v1/stories` |
| `/latest` | `LatestNewsView` | Continuous chronological stream of latest verified news articles | `/api/v1/news?sort=latest` |
| `/breaking` | `BreakingNewsView` | Real-time breaking news ticker and urgent flash alerts | `/api/v1/news?filter=breaking` |
| `/trending` | `TrendingView` | Viral and high-velocity stories being discussed across the region | `/api/v1/news?sort=trending` |
| `/most-read` | `MostReadView` | Most read and viewed articles by audience engagement metrics | `/api/v1/news?sort=views` |
| `/category/:slug` | `CategoryPortalView` | Filtered editorial view for specific news categories (Politics, Economy, Tech, etc.) | `/api/v1/news?category=:slug` |
| `/country/:slug` | `CountryPortalView` | Country-specific news coverage across 20 Arab nations and international agencies | `/api/v1/news?country=:slug` |
| `/source/:slug` | `SourcePortalView` | Individual news source feed, verification status, trust score, and health stats | `/api/v1/sources/:slug` |
| `/topic/:slug` | `TopicPortalView` | AI-curated thematic dossier and story clusters around specific topics | `/api/v1/topics/:slug` |
| `/entity/:slug` | `EntityPortalView` | Named entity recognition dossier (People, Organizations, Locations) | `/api/v1/entities/:slug` |
| `/news/:slug` | `ArticleDetailPage` | Full-screen immersive article reader with AI summaries, audio player, and shares | `/api/v1/news/:slug` |
| `/videos` | `VideoPortalView` | Multimedia video news reports and broadcast coverage | `/api/v1/news?type=video` |
| `/live` | `LivePortalView` | Live blogging and minute-by-minute event coverage stream | `/api/v1/news?type=live` |
| `/search` | `AdvancedSearchView` | Full-text and semantic search across PostgreSQL articles index | `/api/v1/news/search?q=:query` |
| `/following` | `PersonalizedFeedView` | User-tailored custom feed based on followed sources and topics | LocalStorage + API |
| `/saved` | `SavedArticlesView` | Bookmarked and offline-saved articles for later reading | LocalStorage |
| `/history` | `ReadingHistoryView` | User reading history and recently viewed stories | LocalStorage |
| `/notifications` | `NotificationsCenterView` | Push alerts and notification inbox | LocalStorage + API |
| `/profile` | `UserProfileView` | User account settings, role preferences, and notification channels | LocalState / Auth |
| `/settings` | `AppSettingsView` | Reader preferences (Theme, font size, audio speed, language) | LocalStorage |

---

## 2. ENTERPRISE ADMIN CENTRE ROUTES & WORKFLOWS

| Path / Tab ID | Component Name | Purpose & Description | Backend Integration |
| :--- | :--- | :--- | :--- |
| `/admin` (dashboard) | `ExecutiveDashboard` | Executive KPI overview (Articles today, active sources, AI queue, views) | `/api/v1/analytics/overview` |
| `/admin/newsroom` | `EnterpriseAdminDashboard` | Newsroom Workflow: Fetched → Processing → Review → Published | `/api/v1/admin/articles` |
| `/admin/sources` | `SourcesManager` | Enterprise News Sources Catalog management, test fetch, health scores | `/api/v1/admin/sources` |
| `/admin/breaking` | `BreakingNewsManager` | Breaking news broadcast management and push triggers | `/api/v1/admin/breaking` |
| `/admin/stories` | `StoryManager` | AI Story Clustering and multi-source timeline curation | `/api/v1/admin/stories` |
| `/admin/ai` | `AIAggregatorPanel` | Gemini AI pipeline monitor, queue status, prompt tuning, and quotas | `/api/v1/admin/ai` |
| `/admin/social` | `SocialPublisherPanel` | Automated social syndication queue (X, Telegram, Facebook) | `/api/v1/admin/social` |
| `/admin/monetization` | `AdManagerPanel` | Banner ads, sponsored content, and monetization placement manager | `/api/v1/admin/ads` |
| `/admin/push` | `PushNotificationPanel` | Firebase Cloud Messaging (FCM) broadcast center | `/api/v1/admin/push` |
| `/admin/analytics` | `SprintReportsView` | Deep traffic, engagement, reading time, and source reliability analytics | `/api/v1/analytics/*` |
| `/admin/seo` | `SEODashboardPanel` | Master SEO management (Sitemaps, OpenGraph, Schema JSON-LD, Robots.txt) | `/api/v1/admin/seo` |
| `/admin/users` | `UserManager` | User role management (Admin, Editor, Author, Moderator, User) | `/api/v1/admin/users` |
| `/admin/settings` | `SettingsManager` | Global platform branding, API keys, and enterprise system settings | `/api/v1/admin/settings` |
