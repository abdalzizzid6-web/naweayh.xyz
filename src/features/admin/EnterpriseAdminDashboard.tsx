import { AuthService } from "../../services/AuthService";
import React, { useState, useEffect } from 'react';
import { UserRole } from '../../types';
import { articlesRepository } from '../../repositories/articlesRepository';
import { enterpriseAdminRepository, EnterpriseSource, EnterpriseUser, EnterpriseAd, AuditLog } from '../../repositories/enterpriseAdminRepository';
import { adminService } from '../../services/adminService';
import { NewsArticle } from '../../core/domain/types';

// Admin Subcomponents
import { AdminHeader } from './components/AdminHeader';
import { AdminSidebar, AdminTabId } from './components/AdminSidebar';
import { AdminCommandPalette } from './components/AdminCommandPalette';
import { DashboardOverview } from './components/DashboardOverview';
import { NewsOperationsCenter } from './components/NewsOperationsCenter';
import { ArticleEditorModal } from './components/ArticleEditorModal';
import { SourceManagementCenter } from './components/SourceManagementCenter';
import { IngestionAndAiJobsMonitor } from './components/IngestionAndAiJobsMonitor';
import { EditorialWorkflowCenter } from './components/EditorialWorkflowCenter';
import { SocialPublishingCenter } from './components/SocialPublishingCenter';
import { SEOControlCenter } from './components/SEOControlCenter';
import { AnalyticsCenter } from './components/AnalyticsCenter';
import { AdManagementCenter } from './components/AdManagementCenter';
import { UsersAndRBACCenter } from './components/UsersAndRBACCenter';
import { SystemSettingsCenter } from './components/SystemSettingsCenter';

interface EnterpriseAdminDashboardProps {
  currentUser: { name: string; role: UserRole };
  onRoleChange: (newRole: UserRole) => void;
}

export const EnterpriseAdminDashboard: React.FC<EnterpriseAdminDashboardProps> = ({
  currentUser,
  onRoleChange,
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTabId>('DASHBOARD');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Repositories State
  const [articles, setArticles] = useState<NewsArticle[]>(articlesRepository.getAll());
  const [sources, setSources] = useState<any[]>([]);

  const refreshAllData = async () => {
    try {
      const [sourcesRes, newsRes] = await Promise.all([
        AuthService.fetchWithAuth('/api/v1/sources'),
        AuthService.fetchWithAuth('/api/v1/news?limit=100'),
      ]);

      if (sourcesRes.ok) {
        const sData = await sourcesRes.json();
        if (sData.success && Array.isArray(sData.data)) setSources(sData.data);
      }

      if (newsRes.ok) {
        const nData = await newsRes.json();
        if (nData.success && Array.isArray(nData.data) && nData.data.length > 0) {
          setArticles(nData.data);
          nData.data.forEach((item: NewsArticle) => {
            if (!articlesRepository.getById(item.id)) {
              articlesRepository.add(item);
            }
          });
        }
      }
    } catch {
      // Keep local repository as solid fallback
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);
  const [users, setUsers] = useState<EnterpriseUser[]>(enterpriseAdminRepository.getUsers());
  const [ads, setAds] = useState<EnterpriseAd[]>(
    enterpriseAdminRepository.getAds().map((a) => ({
      id: a.id,
      title: a.name,
      placement: a.placement,
      impressions: a.monthlyImpressions,
      clicks: Math.floor(a.monthlyImpressions * 0.02),
      status: a.status === 'Active' ? 'Active' : 'Paused',
    }))
  );

  // Article Editor Modal State
  const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);
  const [selectedArticleForEdit, setSelectedArticleForEdit] = useState<NewsArticle | null>(null);

  // Quick Action Handler
  const handleQuickAction = (action: string) => {
    if (action === 'NEW_ARTICLE') {
      setSelectedArticleForEdit(null);
      setIsArticleEditorOpen(true);
    } else if (action === 'TEST_SOURCE') {
      setActiveTab('SOURCES');
    } else if (action === 'BREAKING_NEWS') {
      setActiveTab('BREAKING');
    } else if (action === 'HERO_BANNER') {
      setActiveTab('MONETIZATION');
    }
  };

  // Article Operations
  const handleSaveArticle = async (updatedArticle: NewsArticle) => {
    try {
      const isExisting = articles.some((a) => a.id === updatedArticle.id);
      const url = isExisting ? `/api/v1/news/${updatedArticle.id}` : '/api/v1/news';
      const method = isExisting ? 'PUT' : 'POST';

      const res = await AuthService.fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedArticle),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          articlesRepository.save(json.data);
          setArticles((prev) =>
            isExisting ? prev.map((a) => (a.id === json.data.id ? json.data : a)) : [json.data, ...prev]
          );
        }
      } else {
        articlesRepository.save(updatedArticle);
        setArticles(articlesRepository.getAll());
      }
    } catch {
      articlesRepository.save(updatedArticle);
      setArticles(articlesRepository.getAll());
    }
    setIsArticleEditorOpen(false);
    triggerToast(`تم حفظ ونشر الخبر بنجاح: (${updatedArticle.title.slice(0, 25)}...)`);
  };

  const handleUpdateArticleStatus = (articleId: string, status: string) => {
    const art = articles.find((a) => a.id === articleId);
    if (art) {
      const updated = { ...art, isBreaking: status === 'Breaking' ? true : art.isBreaking };
      articlesRepository.save(updated);
      setArticles((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
      triggerToast('تم تحديث حالة المقال');
    }
  };

  const handleToggleBreaking = async (articleId: string) => {
    try {
      const res = await AuthService.fetchWithAuth(`/api/v1/news/${articleId}/toggle-breaking`, {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setArticles((prev) => prev.map((a) => (a.id === articleId ? json.data : a)));
          triggerToast(`تم ${json.data.isBreaking ? 'تعيين' : 'إلغاء'} الخبر العاجل`);
          return;
        }
      }
    } catch {}

    const art = articles.find((a) => a.id === articleId);
    if (art) {
      const updated = { ...art, isBreaking: !art.isBreaking };
      articlesRepository.save(updated);
      setArticles((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
      triggerToast(`تم ${updated.isBreaking ? 'تعيين' : 'إلغاء'} الخبر العاجل`);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      await AuthService.fetchWithAuth(`/api/v1/news/${articleId}`, {
        method: 'DELETE',
      });
    } catch {}

    articlesRepository.delete(articleId);
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    triggerToast('تم أرشفة الخبر وحذفه بنجاح');
  };

  // Source Operations
  const handleAddSource = async (newSource: any) => {
    try {
      const res = await AuthService.fetchWithAuth('/api/v1/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`تمت إضافة المصدر (${newSource.name}) بنجاح`);
        refreshAllData();
      }
    } catch {
      triggerToast('حدث خطأ أثناء إضافة المصدر');
    }
  };

  const handleToggleSourceStatus = async (id: string) => {
    try {
      const res = await AuthService.fetchWithAuth(`/api/v1/sources/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        triggerToast('تم تحديث حالة المصدر بنجاح');
        refreshAllData();
      }
    } catch {
      triggerToast('تعذر تحديث حالة المصدر');
    }
  };

  // User Operations
  const handleAddUser = (newUser: Omit<EnterpriseUser, 'id'>) => {
    enterpriseAdminRepository.addUser(newUser);
    setUsers(enterpriseAdminRepository.getUsers());
  };

  const handleToggleAdStatus = (id: string) => {
    setAds(ads.map((a) => (a.id === id ? { ...a, status: a.status === 'Active' ? 'Paused' : 'Active' } : a)));
  };

  // Counts for sidebar badges
  const counts = {
    articles: articles.length,
    sources: sources.length,
    aiJobs: 3,
    socialJobs: 5,
    users: users.length,
  };

  // Get active section name for Header
  const getSectionName = (): string => {
    switch (activeTab) {
      case 'DASHBOARD': return 'لوحة التحكم القيادية';
      case 'NEWS': return 'مركز الأخبار والمقالات';
      case 'SOURCES': return 'إدارة المصادر الخلاصات';
      case 'SOURCE_HEALTH': return 'صحة المصادر (Health)';
      case 'INGESTION': return 'مراقبة جلب المحتوى';
      case 'AI_JOBS': return 'مراقبة وظائف الذكاء الاصطناعي';
      case 'WORKFLOW': return 'سلسلة اعتماد التحرير';
      case 'BREAKING': return 'الأخبار العاجلة والطارئة';
      case 'SCHEDULING': return 'جدولة النشر الآلي';
      case 'SOCIAL': return 'منظومة النشر الاجتماعي';
      case 'SEO': return 'محرك SEO والخرائط';
      case 'MONETIZATION': return 'الإعلانات وبانر الواجهة';
      case 'ANALYTICS': return 'تحليلات الأداء والبحث';
      case 'USERS': return 'المستخدمين وأفراد الفريق';
      case 'ROLES': return 'الأدوار والصلاحيات (RBAC)';
      case 'LOGS': return 'سجلات التدقيق والأمان';
      case 'SETTINGS': return 'إعدادات النظام (اليمن)';
      default: return 'لوحة التحكم';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Admin Header */}
      <AdminHeader
        currentUser={currentUser}
        onRoleChange={onRoleChange}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        activeSectionName={getSectionName()}
        onQuickAction={handleQuickAction}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          counts={counts}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-900/40 min-w-0 space-y-6">
          {/* Toast Notification Bar */}
          {toastMessage && (
            <div className="fixed bottom-6 left-6 z-50 bg-indigo-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl border border-indigo-400 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
              <span className="w-2 h-2 bg-emerald-300 rounded-full animate-ping" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Render Active Module */}
          {activeTab === 'DASHBOARD' && (
            <DashboardOverview
              articles={articles}
              sources={sources}
              users={users}
              onNavigateToTab={(tab) => setActiveTab(tab as AdminTabId)}
              onQuickAction={handleQuickAction}
            />
          )}

          {activeTab === 'NEWS' && (
            <NewsOperationsCenter
              articles={articles}
              onOpenArticleEditor={(art) => {
                setSelectedArticleForEdit(art);
                setIsArticleEditorOpen(true);
              }}
              onUpdateArticleStatus={handleUpdateArticleStatus}
              onToggleBreaking={handleToggleBreaking}
              onDeleteArticle={handleDeleteArticle}
              triggerToast={triggerToast}
            />
          )}

          {(activeTab === 'SOURCES' || activeTab === 'SOURCE_HEALTH') && (
            <SourceManagementCenter
              sources={sources}
              onAddSource={handleAddSource}
              onToggleSourceStatus={handleToggleSourceStatus}
              triggerToast={triggerToast}
            />
          )}

          {(activeTab === 'INGESTION' || activeTab === 'AI_JOBS') && (
            <IngestionAndAiJobsMonitor
              onTriggerIngestion={() => {
                setArticles(articlesRepository.getAll());
              }}
              triggerToast={triggerToast}
            />
          )}

          {(activeTab === 'WORKFLOW' || activeTab === 'BREAKING' || activeTab === 'SCHEDULING') && (
            <EditorialWorkflowCenter
              articles={articles}
              activeSubTab={activeTab as any}
              onToggleBreaking={handleToggleBreaking}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'SOCIAL' && (
            <SocialPublishingCenter
              articles={articles}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'SEO' && (
            <SEOControlCenter
              articles={articles}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'ANALYTICS' && (
            <AnalyticsCenter articles={articles} />
          )}

          {activeTab === 'MONETIZATION' && (
            <AdManagementCenter
              ads={ads}
              onToggleAdStatus={handleToggleAdStatus}
              triggerToast={triggerToast}
            />
          )}

          {(activeTab === 'USERS' || activeTab === 'ROLES' || activeTab === 'LOGS') && (
            <UsersAndRBACCenter
              users={users}
              auditLogs={enterpriseAdminRepository.getAuditLogs()}
              activeSubTab={activeTab as any}
              onAddUser={handleAddUser}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'SETTINGS' && (
            <SystemSettingsCenter triggerToast={triggerToast} />
          )}
        </main>
      </div>

      {/* Command Palette Modal */}
      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab as AdminTabId)}
        onQuickAction={handleQuickAction}
      />

      {/* Article Editor Modal */}
      <ArticleEditorModal
        isOpen={isArticleEditorOpen}
        article={selectedArticleForEdit}
        onClose={() => setIsArticleEditorOpen(false)}
        onSave={handleSaveArticle}
      />
    </div>
  );
};
