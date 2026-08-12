import React from 'react';
import {
  Globe,
  Smartphone,
  Cpu,
  Share2,
  DollarSign,
  Bell,
  LayoutDashboard,
  Shield,
  FileText,
  FolderKanban,
  Menu,
  X,
  Zap,
  SearchCheck,
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';
import { Badge } from '../../components/ui/Badge';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    sidebarOpen,
    setSidebarOpen,
    notificationsOpen,
    setNotificationsOpen,
  } = useApp();

  const navItems = [
    { id: 'portal', label: 'موقع الأخبار', icon: Globe },
    { id: 'mobile', label: 'تطبيق الهاتف', icon: Smartphone },
    { id: 'ai_aggregator', label: 'محرك الذكاء الاصطناعي', icon: Cpu },
    { id: 'social', label: 'النشر الآلي', icon: Share2 },
    { id: 'monetization', label: 'إدارة الإعلانات', icon: DollarSign },
    { id: 'push', label: 'الإشعارات', icon: Bell },
    { id: 'seo', label: 'محرك SEO الخرائط', icon: SearchCheck },
    { id: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard },
    { id: 'admin', label: 'الأمان والأنظمة', icon: Shield },
    { id: 'projects', label: 'إدارة المشاريع', icon: FolderKanban },
    { id: 'reports', label: 'التقارير', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Mobile Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm ring-2 ring-indigo-500/30">
                ن
              </div>
              <div dir="rtl">
                <span className="font-bold text-base text-white tracking-tight block leading-tight flex items-center gap-1.5">
                  أخبار نوعية
                  <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
                    Naw3iya
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                  Naw3iya News Platform
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavTab)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Notification Trigger */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
              </button>

              {notificationsOpen && (
                <div dir="rtl" className="absolute left-0 mt-2 w-80 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-800 p-4 text-xs space-y-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-semibold text-white flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-rose-500" />
                      تنبيهات المنصة المباشرة
                    </span>
                    <Badge variant="rose">مباشر</Badge>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <p className="p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                      <strong className="text-white block text-xs">تم تجميع 1,248 خبر جديد</strong>
                      تطبيق التجميع المزدوج والتنظيف الآلي بـ Gemini 2.5 Flash.
                    </p>
                    <p className="p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                      <strong className="text-white block text-xs">بث اجتماعي ناجح</strong>
                      تم نشر 42 خبر عاجل تلقائياً على منصة X وتليجرام.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                AS
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-xs font-semibold text-white block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-indigo-400 font-semibold block">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex">
          <div className="w-64 bg-slate-900 text-white h-full shadow-2xl p-4 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-white text-sm">القائمة الرئيسية</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1 flex-1" dir="rtl">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as NavTab);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
              <p>الدور الوظيفي: <strong className="text-indigo-400">{currentUser.role}</strong></p>
            </div>
          </div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Global Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4" dir="rtl">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">منصة أخبار نوعية — Naw3iya News Network</span>
            <span>•</span>
            <span>الأخبار كما تستحق أن تُقرأ</span>
          </div>
          <p>© 2026 أخبار نوعية. جميع الحقوق محفوظة لشبكة أخبار نوعية الإخبارية (naweayh.xyz).</p>
        </div>
      </footer>
    </div>
  );
};
