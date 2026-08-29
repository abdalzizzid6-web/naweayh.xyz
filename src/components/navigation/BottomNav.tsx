import React from 'react';
import { Home, Compass, Search, Newspaper, Bookmark } from 'lucide-react';

export type PortalTab = 'home' | 'latest' | 'topics' | 'my_feed' | 'saved';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSearch: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenSearch,
}) => {
  const tabs = [
    { id: 'portal', label: 'الرئيسية', icon: Home },
    { id: 'topics', label: 'استكشاف', icon: Compass },
    { id: 'search', label: 'بحث', icon: Search, isAction: true },
    { id: 'my_feed', label: 'أخبارك', icon: Newspaper },
    { id: 'saved', label: 'المحفوظات', icon: Bookmark },
  ];

  return (
    <nav
      dir="rtl"
      aria-label="شريط التنقل السفلي"
      className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-400 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 z-50 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-around"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          (tab.id === 'portal' && (activeTab === 'portal' || activeTab === 'home')) ||
          activeTab === tab.id;

        if (tab.isAction) {
          return (
            <button
              key={tab.id}
              onClick={onOpenSearch}
              className="flex flex-col items-center justify-center w-11 h-11 rounded-full bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white shadow-md shadow-emerald-900/30 transition-transform"
              title="البحث الذكي"
              aria-label="البحث الذكي"
            >
              <Icon className="w-5 h-5 stroke-[2.5]" />
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 min-w-[52px] min-h-[44px] ${
              isActive
                ? 'text-emerald-800 dark:text-emerald-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              {tab.id === 'topics' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-bold whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
