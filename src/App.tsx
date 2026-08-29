import React from 'react';
import { AppProvider, MainLayout, PortalLayout, useApp } from './presentation';
import { PortalView } from './features/portal/PortalView';
import { ArticleDetailPage } from './features/portal/ArticleDetailPage';
import { StoryDetailPage } from './features/portal/StoryDetailPage';
import { MobileAppSimulator } from './features/mobile/MobileAppSimulator';
import { AIAggregatorPanel } from './features/aggregator/AIAggregatorPanel';
import { SocialPublisherPanel } from './features/social/SocialPublisherPanel';
import { AdManagerPanel } from './features/monetization/AdManagerPanel';
import { PushNotificationPanel } from './features/notifications/PushNotificationPanel';
import { ExecutiveDashboard } from './features/dashboard/ExecutiveDashboard';
import { EnterpriseAdminDashboard } from './features/admin/EnterpriseAdminDashboard';
import { SprintReportsView } from './features/reports/SprintReportsView';
import { ProjectManager } from './features/projects/ProjectManager';
import { SEODashboardPanel } from './features/seo/SEODashboardPanel';
import { SEOHead } from './seo-engine/SEOHead';

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
    isNotFound,
    navigate,
  } = useApp();

  const portalTabs = ['portal', 'latest', 'topics', 'my_feed', 'saved', 'yemen', 'arab', 'world', 'business', 'tech', 'sports', 'video', 'live'];
  const isPortalTab = portalTabs.includes(activeTab);

  const portalContent = (
    <>
      {!articleSlug && (
        <SEOHead
          category={categorySlug || undefined}
          source={sourceSlug || undefined}
          searchQuery={searchQuery !== null ? searchQuery : undefined}
          is404={isNotFound}
        />
      )}
      {storySlug ? (
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

  const adminContent = (
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

  return isPortalTab ? (
    <PortalLayout>{portalContent}</PortalLayout>
  ) : (
    <MainLayout>{adminContent}</MainLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
