import React from 'react';
import { Home, Zap, Layers, Bookmark, UserCheck, Search } from 'lucide-react';

export type PortalTab = 'home' | 'latest' | 'categories' | 'saved' | 'my_feed';

interface BottomNavProps {
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  onOpenSearch: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenSearch,
}) => {
  const tabs = [
    { id: 'home' as PortalTab, label: 'الرئيسية', icon: Home },
    { id: 'latest' as PortalTab, label: 'آخر الأخبار', icon: Zap },
    { id: 'categories' as PortalTab, label: 'الأقسام والدول', icon: Layers },
    { id: 'my_feed' as PortalTab, label: 'أخبارك', icon: UserCheck },
    { id: 'saved' as PortalTab, label: 'المحفوظات', icon: Bookmark },
  ];

  return (
    <div
      dir="rtl"
      className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 dark:bg-slate-950/95 text-slate-300 backdrop-blur-md border-t border-slate-800 z-50 px-2 py-1.5 shadow-2xl flex items-center justify-around"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 min-w-[56px] ${
              isActive
                ? 'text-indigo-400 font-black scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              {tab.id === 'latest' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-semibold whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Floating Action Search Trigger */}
      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center p-2 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-transform"
        title="البحث الذكي"
      >
        <Search className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
};
