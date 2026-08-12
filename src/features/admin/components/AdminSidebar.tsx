import React from 'react';
import {
  BarChart3,
  FileText,
  Rss,
  Activity,
  Layers,
  Cpu,
  Share2,
  Search,
  DollarSign,
  Users,
  UserCheck,
  Shield,
  Sliders,
  Clock,
  Zap,
  Megaphone,
  Sparkles,
  ChevronLeft,
  AlertCircle,
  GitBranch,
} from 'lucide-react';

export type AdminTabId =
  | 'DASHBOARD'
  | 'NEWS'
  | 'SOURCES'
  | 'SOURCE_HEALTH'
  | 'INGESTION'
  | 'AI_JOBS'
  | 'WORKFLOW'
  | 'BREAKING'
  | 'SCHEDULING'
  | 'SOCIAL'
  | 'SEO'
  | 'MONETIZATION'
  | 'ANALYTICS'
  | 'USERS'
  | 'ROLES'
  | 'LOGS'
  | 'SETTINGS';

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onSelectTab: (tabId: AdminTabId) => void;
  counts: {
    articles: number;
    sources: number;
    aiJobs: number;
    socialJobs: number;
    users: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  counts,
}) => {
  const groups = [
    {
      title: 'العمليات والمحتوى الإخباري',
      items: [
        { id: 'DASHBOARD' as AdminTabId, label: 'لوحة التحكم القيادية', icon: BarChart3 },
        { id: 'NEWS' as AdminTabId, label: 'مركز الأخبار والمقالات', icon: FileText, count: counts.articles },
        { id: 'SOURCES' as AdminTabId, label: 'إدارة المصادر والخلاصات', icon: Rss, count: counts.sources },
        { id: 'SOURCE_HEALTH' as AdminTabId, label: 'صحة المصادر (Health)', icon: Activity },
      ],
    },
    {
      title: 'محركات الجلب والذكاء الاصطناعي',
      items: [
        { id: 'INGESTION' as AdminTabId, label: 'مراقبة جلب المحتوى', icon: Layers },
        { id: 'AI_JOBS' as AdminTabId, label: 'مراقبة وظائف AI', icon: Cpu, count: counts.aiJobs },
        { id: 'WORKFLOW' as AdminTabId, label: 'دورة اعتماد التحرير', icon: GitBranch },
      ],
    },
    {
      title: 'النشر والتوزيع والجدولة',
      items: [
        { id: 'BREAKING' as AdminTabId, label: 'الأخبار العاجلة', icon: AlertCircle },
        { id: 'SCHEDULING' as AdminTabId, label: 'جدولة النشر الآلي', icon: Clock },
        { id: 'SOCIAL' as AdminTabId, label: 'منظومة النشر الاجتماعي', icon: Share2, count: counts.socialJobs },
      ],
    },
    {
      title: 'الانتشار والإعلانات والتحليلات',
      items: [
        { id: 'SEO' as AdminTabId, label: 'محرك SEO والخرائط', icon: Search },
        { id: 'MONETIZATION' as AdminTabId, label: 'الإعلانات وبانر الواجهة', icon: DollarSign },
        { id: 'ANALYTICS' as AdminTabId, label: 'تحليلات الأداء والبحث', icon: BarChart3 },
      ],
    },
    {
      title: 'الأمان والمدراء والنظام',
      items: [
        { id: 'USERS' as AdminTabId, label: 'المستخدمين وأفراد الفريق', icon: Users, count: counts.users },
        { id: 'ROLES' as AdminTabId, label: 'الأدوار والصلاحيات (RBAC)', icon: UserCheck },
        { id: 'LOGS' as AdminTabId, label: 'سجلات التدقيق والأمان', icon: Shield },
        { id: 'SETTINGS' as AdminTabId, label: 'إعدادات النظام (اليمن)', icon: Sliders },
      ],
    },
  ];

  return (
    <aside dir="rtl" className="w-full lg:w-64 bg-slate-900 border-l border-slate-800 text-slate-300 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">Naw3iya Operations Hub</h3>
            <span className="text-[10px] text-slate-400">Enterprise Admin v5.0</span>
          </div>
        </div>
      </div>

      <nav className="p-3 space-y-6 overflow-y-auto scrollbar-thin flex-1">
        {groups.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            <h4 className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              {group.title}
            </h4>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status Footbar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold text-slate-300">الأنظمة تعمل بنشاط</span>
        </div>
        <span className="text-[10px] font-mono text-indigo-400">Asia/Aden</span>
      </div>
    </aside>
  );
};
