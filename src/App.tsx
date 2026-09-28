import React, { Suspense, lazy } from 'react';
import { AppProvider, MainLayout, PortalLayout, useApp } from './presentation';
import { PortalView } from './features/portal/PortalView';
import { SEOHead } from './seo-engine/SEOHead';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import { Loader2 } from 'lucide-react';

// Lazy Loaded Feature & Admin Components for Ultra-Fast Initial Bundle
const ArticleDetailPage = lazy(() =>
  import('./features/portal/ArticleDetailPage').then((m) => ({ default: m.ArticleDetailPage }))
);
const StoryDetailPage = lazy(() =>
  import('./features/portal/StoryDetailPage').then((m) => ({ default: m.StoryDetailPage }))
);
const MobileAppSimulator = lazy(() =>
  import('./features/mobile/MobileAppSimulator').then((m) => ({ default: m.MobileAppSimulator }))
);
const AIAggregatorPanel = lazy(() =>
  import('./features/aggregator/AIAggregatorPanel').then((m) => ({ default: m.AIAggregatorPanel }))
);
const SocialPublisherPanel = lazy(() =>
  import('./features/social/SocialPublisherPanel').then((m) => ({ default: m.SocialPublisherPanel }))
);
const AdManagerPanel = lazy(() =>
  import('./features/monetization/AdManagerPanel').then((m) => ({ default: m.AdManagerPanel }))
);
const PushNotificationPanel = lazy(() =>
  import('./features/notifications/PushNotificationPanel').then((m) => ({ default: m.PushNotificationPanel }))
);
const ExecutiveDashboard = lazy(() =>
  import('./features/dashboard/ExecutiveDashboard').then((m) => ({ default: m.ExecutiveDashboard }))
);
const EnterpriseAdminDashboard = lazy(() =>
  import('./features/admin/EnterpriseAdminDashboard').then((m) => ({ default: m.EnterpriseAdminDashboard }))
);
const SprintReportsView = lazy(() =>
  import('./features/reports/SprintReportsView').then((m) => ({ default: m.SprintReportsView }))
);
const ProjectManager = lazy(() =>
  import('./features/projects/ProjectManager').then((m) => ({ default: m.ProjectManager }))
);
const SEODashboardPanel = lazy(() =>
  import('./features/seo/SEODashboardPanel').then((m) => ({ default: m.SEODashboardPanel }))
);
const AdminLogin = lazy(() =>
  import('./features/admin/AdminLogin').then((m) => ({ default: m.AdminLogin }))
);

// Lazy Loaded Legal & Static Pages
const PrivacyPolicyPage = lazy(() =>
  import('./features/pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const TermsPage = lazy(() =>
  import('./features/pages/TermsPage').then((m) => ({ default: m.TermsPage }))
);
const AboutPage = lazy(() =>
  import('./features/pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const ContactPage = lazy(() =>
  import('./features/pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const EditorialGuidelinesPage = lazy(() =>
  import('./features/pages/EditorialGuidelinesPage').then((m) => ({ default: m.EditorialGuidelinesPage }))
);
const CookiePolicyPage = lazy(() =>
  import('./features/pages/CookiePolicyPage').then((m) => ({ default: m.CookiePolicyPage }))
);
const CorrectionsPolicyPage = lazy(() =>
  import('./features/pages/CorrectionsPolicyPage').then((m) => ({ default: m.CorrectionsPolicyPage }))
);
const AdvertisingPolicyPage = lazy(() =>
  import('./features/pages/AdvertisingPolicyPage').then((m) => ({ default: m.AdvertisingPolicyPage }))
);

function PageLoadingFallback() {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center" aria-live="polite">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-500">جاري تحميل المحتوى...</p>
    </div>
  );
}

function AppContent() {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    handleRoleChange,
    articleSlug,
    storySlug,
    categorySlug,
    sourceSlug,
    searchQuery,
    staticPageRoute,
    isNotFound,
    navigate,
    isAuthLoading,
  } = useApp();

  const portalTabs = ['portal', 'latest', 'topics', 'my_feed', 'saved', 'yemen', 'arab', 'world', 'business', 'tech', 'sports', 'video', 'live'];
  const isPortalTab = portalTabs.includes(activeTab);

  const portalContent = (
    <>
      {!articleSlug && !staticPageRoute && (
        <SEOHead
          category={categorySlug || undefined}
          source={sourceSlug || undefined}
          searchQuery={searchQuery !== null ? searchQuery : undefined}
          is404={isNotFound}
        />
      )}
      {staticPageRoute === 'privacy' ? (
        <PrivacyPolicyPage onNavigateHome={() => navigate('/')} />
      ) : staticPageRoute === 'terms' ? (
        <TermsPage onNavigateHome={() => navigate('/')} />
      ) : staticPageRoute === 'about' ? (
        <AboutPage onNavigateHome={() => navigate('/')} />
      ) : staticPageRoute === 'contact' ? (
        <ContactPage onNavigateHome={() => navigate('/')} />
      ) : staticPageRoute === 'editorial' ? (
        <EditorialGuidelinesPage onNavigateHome={() => navigate('/')} />
      ) : staticPageRoute === 'cookies' ? (
        <CookiePolicyPage onNavigateHome={() => navigate('/')} />
      ) : staticPageRoute === 'corrections' ? (
        <CorrectionsPolicyPage onNavigateHome={() => navigate('/')} />
      ) : staticPageRoute === 'advertising' ? (
        <AdvertisingPolicyPage onNavigateHome={() => navigate('/')} />
      ) : storySlug ? (
        <StoryDetailPage
          slug={storySlug}
          onNavigateHome={() => navigate('/')}
          onOpenArticleBySlug={(slug) => navigate(`/news/${slug}`)}
        />
      ) : articleSlug ? (
        <ArticleDetailPage
          slug={articleSlug}
          onNavigateHome={() => navigate('/')}
          onOpenArticleBySlug={(slug) => navigate(`/news/${slug}`)}
        />
      ) : (
        <PortalView />
      )}
    </>
  );

  const adminContent = isAuthLoading ? (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
      <p className="text-slate-400 font-bold">جاري التحقق من الصلاحيات...</p>
    </div>
  ) : !currentUser ? (
    <AdminLogin />
  ) : (
    <>
      {activeTab === 'mobile' && <MobileAppSimulator />}
      {activeTab === 'ai_aggregator' && <AIAggregatorPanel />}
      {activeTab === 'social' && <SocialPublisherPanel />}
      {activeTab === 'monetization' && <AdManagerPanel />}
      {activeTab === 'push' && <PushNotificationPanel />}
      {activeTab === 'seo' && <SEODashboardPanel />}
      {activeTab === 'dashboard' && (
        <ExecutiveDashboard
          currentUser={currentUser}
          onNavigateToProjects={() => setActiveTab('projects')}
          onNavigateToAnalytics={() => setActiveTab('ai_aggregator')}
          onNavigateToAdmin={() => setActiveTab('admin')}
        />
      )}
      {activeTab === 'admin' && (
        <EnterpriseAdminDashboard currentUser={currentUser} onRoleChange={handleRoleChange} />
      )}
      {activeTab === 'projects' && <ProjectManager currentUser={currentUser} />}
      {activeTab === 'reports' && <SprintReportsView />}
    </>
  );

  return (
    <>
      {isPortalTab ? (
        <PortalLayout>
          <Suspense fallback={<PageLoadingFallback />}>
            {portalContent}
          </Suspense>
        </PortalLayout>
      ) : (
        <Suspense fallback={<PageLoadingFallback />}>
          {currentUser ? <MainLayout>{adminContent}</MainLayout> : adminContent}
        </Suspense>
      )}
      <CookieConsentBanner />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
