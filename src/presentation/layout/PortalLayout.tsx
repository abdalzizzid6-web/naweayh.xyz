import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  User, 
  Bookmark, 
  Sun, 
  Moon, 
  ShieldCheck, 
  CheckCircle2,
  X,
  Compass,
  TrendingUp,
  Radio,
  Layers,
  MapPin,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';
import { BottomNav } from '../../components/navigation/BottomNav';
import { SearchEnginePanel } from '../../features/portal/SearchEnginePanel';
import { newsService } from '../../services/newsService';

export const PortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, currentUser, sidebarOpen, setSidebarOpen, navigate } = useApp();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [savedCount, setSavedCount] = useState<number>(0);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('omni_theme') === 'dark' || 
      (!localStorage.getItem('omni_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('omni_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('omni_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setSavedCount(newsService.getSavedArticles().length);
  }, [activeTab]);

  // Keyboard shortcut ⌘K / Ctrl+K to toggle search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Primary Editorial Categories
  const newsCategories = [
    { id: 'portal', label: 'الرئيسية' },
    { id: 'latest', label: 'عاجل والآن' },
    { id: 'topics', label: 'استكشاف' },
    { id: 'my_feed', label: 'متابعاتي' },
    { id: 'yemen', label: 'اليمن' },
    { id: 'arab', label: 'العالم العربي' },
    { id: 'world', label: 'شؤون دولية' },
    { id: 'business', label: 'اقتصاد ومال' },
    { id: 'tech', label: 'تكنولوجيا وذكاء' },
    { id: 'sports', label: 'رياضة' },
    { id: 'saved', label: 'المحفوظات' },
  ];

  const currentDateArabic = new Date().toLocaleDateString('ar-YE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-emerald-700 selection:text-white transition-colors duration-200" dir="rtl">
      
      {/* 1. Top Editorial Utility Header Bar */}
      <div className="bg-slate-900 dark:bg-black text-slate-300 text-xs border-b border-slate-800 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400 font-medium hidden sm:inline-block">
              {currentDateArabic}
            </span>
            <span className="hidden md:inline-block text-slate-700">•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              بث إخباري مباشر ومستمر
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400 hidden lg:inline-block">
              تغطية ذكية موثقة من <strong className="text-slate-200 font-bold">45+ مصدراً معتمداً</strong>
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
                <span className="hidden sm:inline text-[10px]">{isDarkMode ? 'نهاري' : 'ليلي'}</span>
              </button>
              <a href="https://naweayh.xyz" target="_blank" rel="noreferrer noopener" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                naweayh.xyz
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main Brand Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          
          {/* Right: Hamburger (Mobile) + Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="القائمة الجانبية"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div 
              className="flex items-center gap-3 cursor-pointer group select-none" 
              onClick={() => {
                setActiveTab('portal');
                navigate('/');
              }}
            >
              <div className="w-11 h-11 bg-emerald-800 text-white font-black flex items-center justify-center text-2xl rounded-2xl shadow-md shadow-emerald-800/20 group-hover:bg-emerald-700 transition-all group-hover:scale-105">
                ن
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-2xl sm:text-2xl text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    أخبار نوعية
                  </span>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                    رسمي
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-extrabold tracking-wider uppercase mt-1">
                  OMNINEWS • المنصة الذكية
                </span>
              </div>
            </div>
          </div>

          {/* Center Search Input Trigger (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-6">
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="relative w-full cursor-pointer group"
            >
              <div className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-500 text-xs sm:text-sm rounded-xl pr-10 pl-16 py-2.5 text-slate-500 dark:text-slate-400 flex items-center justify-between transition-all shadow-2xs">
                <span>ابحث في الأخبار، المصادر، والتحليلات بالذكاء الاصطناعي...</span>
                <kbd className="hidden sm:inline-block text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded shadow-xs">
                  ⌘K
                </kbd>
              </div>
              <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 absolute right-3.5 top-3.5 transition-colors" />
            </div>
          </div>

          {/* Left Actions: Search Mobile, Saved Bookmarks, Newsroom switch, User */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="البحث"
            >
              <Search className="w-5 h-5" />
            </button>

            <button 
              onClick={() => {
                setActiveTab('saved');
                navigate('/saved');
              }}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
              title="المقالات المحفوظة"
            >
              <Bookmark className="w-5 h-5" />
              {savedCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {savedCount}
                </span>
              )}
            </button>

            {/* Newsroom Control Switcher (For Authorized Editorial Roles) */}
            {(currentUser.role === 'System Admin' || currentUser.role === 'Executive' || currentUser.role === 'Editor-in-Chief') && (
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-950 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>غرفة الأخبار</span>
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2 p-1">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-2xs">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 3. Horizontal Editorial Topic Navigation Bar */}
        <nav className="bg-slate-100/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2">
            {newsCategories.map((cat) => {
              const isActive = activeTab === cat.id || (cat.id === 'portal' && activeTab === 'portal');
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveTab(cat.id as NavTab);
                    if (cat.id === 'portal') navigate('/');
                    else if (cat.id === 'saved') navigate('/saved');
                    else if (cat.id === 'my_feed') navigate('/my-feed');
                    else if (cat.id === 'topics') navigate('/topics');
                  }}
                  className={`px-3.5 py-2.5 text-xs font-black transition-all whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-2xs'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Slide-out Sidebar Drawer on Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-800 text-white font-black flex items-center justify-center text-lg rounded-xl">
                    ن
                  </div>
                  <span className="font-black text-lg text-slate-900 dark:text-white">أخبار نوعية</span>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">الأقسام والتغطيات</p>
                {newsCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveTab(cat.id as NavTab);
                      setSidebarOpen(false);
                      if (cat.id === 'portal') navigate('/');
                      else if (cat.id === 'saved') navigate('/saved');
                      else if (cat.id === 'my_feed') navigate('/my-feed');
                      else if (cat.id === 'topics') navigate('/topics');
                    }}
                    className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      activeTab === cat.id
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">المظهر:</span>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Interactive Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 my-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">محرك البحث الإخباري الذكي</h3>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
              <SearchEnginePanel
                onSelectArticle={(art) => {
                  setIsSearchOpen(false);
                  if (art.slug) navigate(`/news/${art.slug}`);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto pb-24 lg:pb-12">
        {children}
      </main>

      {/* 4. Mobile Bottom Navigation Bar (Handhelds 360px - 412px) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab as NavTab);
          if (tab === 'portal' || tab === 'home') navigate('/');
          else if (tab === 'saved') navigate('/saved');
          else if (tab === 'my_feed') navigate('/my-feed');
          else if (tab === 'topics') navigate('/topics');
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 5. Global Editorial Footer */}
      <footer className="bg-slate-900 dark:bg-black text-slate-300 py-12 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-700 text-white font-black flex items-center justify-center text-lg rounded-xl">
                ن
              </div>
              <span className="font-extrabold text-lg text-white">أخبار نوعية</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              منصة إخبارية صحفية نوعية تهدف إلى تقديم تغطية إخبارية مستقلة وعميقة عبر الذكاء الاصطناعي وتجميع أكثر من 45 مصدراً موثقاً.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">الأقسام والتغطيات</h4>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => { setActiveTab('portal'); navigate('/'); }} className="hover:text-emerald-400 transition-colors">الأخبار العاجلة</button></li>
              <li><button onClick={() => { setActiveTab('yemen'); }} className="hover:text-emerald-400 transition-colors">تغطية اليمن والخليج</button></li>
              <li><button onClick={() => { setActiveTab('business'); }} className="hover:text-emerald-400 transition-colors">الاقتصاد والتكنولوجيا</button></li>
              <li><button onClick={() => { setActiveTab('topics'); navigate('/topics'); }} className="hover:text-emerald-400 transition-colors">قصص الأحداث الموحدة</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm">المنصة والمعايير</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">المصادر المعتمدة ومؤشرات الثقة</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">دليل النشر والأخلاقيات الصحفية</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">سياسة الخصوصية واستخدام البيانات</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">شروط الاستخدام</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm">التواصل والتغذية</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">اتصل بغرفة الأخبار</a></li>
              <li><a href="/rss.xml" target="_blank" className="hover:text-emerald-400 transition-colors">خلاصات RSS والمعاينة</a></li>
              <li><a href="/sitemap-news.xml" target="_blank" className="hover:text-emerald-400 transition-colors">خريطة أخبار Google</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} أخبار نوعية — NAW3IYA NEWS. جميع الحقوق محفوظة لشبكة أخبار نوعية الإخبارية (naweayh.xyz).</p>
          <div className="flex items-center gap-4">
            <span>حقوق النشر محفوظة</span>
            <span>•</span>
            <span>النسخة 2.0 Editorial Intelligence</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
