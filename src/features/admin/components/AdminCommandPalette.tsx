import React, { useState, useEffect } from 'react';
import { Search, X, ChevronRight, FileText, Rss, Users, Globe, Languages, DollarSign, Cpu, Search as SearchIcon, BarChart3, Shield, UserCheck, Lock, Database, Key, Sliders, Clock, Layers, Zap, Activity, Share2, Megaphone, AlertCircle } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: any;
  action: () => void;
}

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
  onQuickAction: (action: string) => void;
}

export const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onQuickAction,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled externally
        }
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands: CommandItem[] = [
    { id: 'DASHBOARD', title: 'لوحة التحكم والإحصائيات الرئيسية', category: 'الأنظمة', icon: BarChart3, action: () => { onSelectTab('DASHBOARD'); onClose(); } },
    { id: 'NEWS', title: 'مركز عمليات الأخبار والمقالات', category: 'العمليات', icon: FileText, action: () => { onSelectTab('NEWS'); onClose(); } },
    { id: 'SOURCES', title: 'إدارة المصادر وخلاصات RSS', category: 'العمليات', icon: Rss, action: () => { onSelectTab('SOURCES'); onClose(); } },
    { id: 'SOURCE_HEALTH', title: 'صحة واستجابة المصادر (Source Health)', category: 'العمليات', icon: Activity, action: () => { onSelectTab('SOURCE_HEALTH'); onClose(); } },
    { id: 'SOURCE_TEST', title: 'اختبار فحص المصادر الفوري', category: 'إجراءات تكتيكية', icon: Zap, action: () => { onQuickAction('TEST_SOURCE'); onClose(); } },
    { id: 'NEW_ARTICLE', title: 'إنشاء خبر جديد بمحرر الذكاء الاصطناعي', category: 'إجراءات تكتيكية', icon: FileText, action: () => { onQuickAction('NEW_ARTICLE'); onClose(); } },
    { id: 'BREAKING_NEWS', title: 'مركز إدارة وجدولة الأخبار العاجلة', category: 'العمليات', icon: AlertCircle, action: () => { onSelectTab('BREAKING'); onClose(); } },
    { id: 'INGESTION', title: 'مراقبة جلب الأخبار وتدفق المحتوى', category: 'الذكاء والأنظمة', icon: Layers, action: () => { onSelectTab('INGESTION'); onClose(); } },
    { id: 'AI_JOBS', title: 'مراقبة مهام معالجة Gemini AI', category: 'الذكاء والأنظمة', icon: Cpu, action: () => { onSelectTab('AI_JOBS'); onClose(); } },
    { id: 'SOCIAL', title: 'منظومة النشر التلقائي للتواصل الاجتماعي', category: 'التوزيع', icon: Share2, action: () => { onSelectTab('SOCIAL'); onClose(); } },
    { id: 'SEO', title: 'مركز SEO والخرائط البرمجية Google News', category: 'التسويق والنشر', icon: SearchIcon, action: () => { onSelectTab('SEO'); onClose(); } },
    { id: 'MONETIZATION', title: 'إدارة الإعلانات وبانرات الصفحة الرئيسية', category: 'التسويق والنشر', icon: DollarSign, action: () => { onSelectTab('MONETIZATION'); onClose(); } },
    { id: 'HERO_BANNER', title: 'إدارة بانر الإعلان الرئيسي في الواجهة', category: 'التسويق والنشر', icon: Megaphone, action: () => { onQuickAction('HERO_BANNER'); onClose(); } },
    { id: 'ANALYTICS', title: 'مركز التحليلات وبحث المستخدمين', category: 'التحليلات', icon: BarChart3, action: () => { onSelectTab('ANALYTICS'); onClose(); } },
    { id: 'USERS', title: 'إدارة المستخدمين وأفراد الفريق', category: 'الأمان والمدراء', icon: Users, action: () => { onSelectTab('USERS'); onClose(); } },
    { id: 'ROLES', title: 'إدارة الأدوار والمستويات الإدارية', category: 'الأمان والمدراء', icon: UserCheck, action: () => { onSelectTab('ROLES'); onClose(); } },
    { id: 'LOGS', title: 'سجلات التدقيق والأمان اللحظية', category: 'الأمان والمدراء', icon: Shield, action: () => { onSelectTab('LOGS'); onClose(); } },
    { id: 'SETTINGS', title: 'إعدادات النظام والمنطقة الزمنية (اليمن)', category: 'الإعدادات', icon: Sliders, action: () => { onSelectTab('SETTINGS'); onClose(); } },
  ];

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            placeholder="اكتب للبحث السريع في الوظائف، الأقسام، والإجراءات..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Command Items List */}
        <div className="p-2 max-h-96 overflow-y-auto divide-y divide-slate-800/50">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              لم يتم العثور على أي نتائج مطابقة لـ "{query}"
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full p-3 hover:bg-slate-800/80 rounded-xl flex items-center justify-between transition-colors text-right group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 group-hover:bg-indigo-600/20 text-indigo-400 rounded-lg border border-slate-700/50 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.category}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span>اضغط <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">ESC</kbd> للإغلاق</span>
          <span className="font-mono text-indigo-400 font-bold">Naw3iya Engine v5.0</span>
        </div>
      </div>
    </div>
  );
};
