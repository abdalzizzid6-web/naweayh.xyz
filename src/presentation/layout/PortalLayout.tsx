import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  User, 
  Bell, 
  Bookmark, 
  Radio, 
  Globe2, 
  SlidersHorizontal,
  Home,
  Newspaper,
  Compass,
  Video,
  ShieldCheck,
  Zap,
  TrendingUp,
  LayoutGrid,
  Sun,
  Moon,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';

export const PortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, currentUser, sidebarOpen, setSidebarOpen, navigate } = useApp();
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

  // Primary Editorial Categories
  const newsCategories = [
    { id: 'portal', label: 'الرئيسية' },
    { id: 'latest', label: 'عاجل والآن' },
    { id: 'my_feed', label: 'أخبارك ومتابعاتك' },
    { id: 'yemen', label: 'اليمن' },
    { id: 'arab', label: 'العالم العربي' },
    { id: 'world', label: 'شؤون دولية' },
    { id: 'business', label: 'اقتصاد ومال' },
    { id: 'tech', label: 'تكنولوجيا وذكاء' },
    { id: 'sports', label: 'رياضة' },
    { id: 'video', label: 'فيديو وملتيميديا' },
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
              تغطية شاملة من <strong className="text-slate-200 font-bold">45+ مصدراً إخبارياً معتمداً</strong>
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
              <a href="https://naweayh.xyz" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                naweayh.xyz
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main Brand Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          
          {/* Right: Hamburger + Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="القائمة"
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
                  NAW3IYA NEWS • المنصة الذكية
                </span>
              </div>
            </div>
          </div>

          {/* Center Search Input Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="ابحث في أكثر من 45 مصدر إخباري بالذكاء الاصطناعي..."
                onClick={() => {
                  setActiveTab('portal');
                  navigate('/?search=true');
                }}
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 text-sm rounded-xl pr-10 pl-16 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <kbd className="hidden sm:inline-block absolute left-3 top-2.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded shadow-xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Left Actions: Notifications, Saved, Newsroom Switch, User */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => {
                setActiveTab('portal');
                navigate('/?search=true');
              }}
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
            </button>

            {/* Newsroom Control Switcher (For Authorized Users) */}
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

        {/* 3. Secondary Section & Category Editorial Navigation Bar */}
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

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto pb-20 lg:pb-12">
        {children}
      </main>

      {/* 4. Mobile Bottom Navigation Bar (Handhelds 360px - 412px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around text-[10px] font-bold text-slate-600 dark:text-slate-400 shadow-lg">
        <button
          onClick={() => {
            setActiveTab('portal');
            navigate('/');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'portal' ? 'text-emerald-700 dark:text-emerald-400' : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>الرئيسية</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('my_feed');
            navigate('/my-feed');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'my_feed' ? 'text-emerald-700 dark:text-emerald-400' : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Newspaper className="w-5 h-5" />
          <span>أخبارك</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('topics');
            navigate('/topics');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'topics' ? 'text-emerald-700 dark:text-emerald-400' : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>الأقسام</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('saved');
            navigate('/saved');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'saved' ? 'text-emerald-700 dark:text-emerald-400' : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span>المحفوظات</span>
        </button>
      </div>

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
              منصة إخبارية صحفية نوعية تهدف إلى تقديم تغطية إخبارية صحفية مستقلة وعميقة عبر خوارزميات الذكاء الاصطناعي وتجميع المصادر المعتمدة الموثوقة.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">الأقسام والتغطيات</h4>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => setActiveTab('portal')} className="hover:text-emerald-400 transition-colors">الأخبار العاجلة</button></li>
              <li><button onClick={() => setActiveTab('portal')} className="hover:text-emerald-400 transition-colors">تغطية اليمن والخليج</button></li>
              <li><button onClick={() => setActiveTab('portal')} className="hover:text-emerald-400 transition-colors">الاقتصاد والتكنولوجيا</button></li>
              <li><button onClick={() => setActiveTab('portal')} className="hover:text-emerald-400 transition-colors">قصص الأحداث الموحدة</button></li>
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
              <li><a href="#" className="hover:text-emerald-400 transition-colors">خلاصات RSS والمعاينة</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">خدمات النشرات البريدية</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} أخبار نوعية — Naw3iya News Network. جميع الحقوق محفوظة لشبكة أخبار نوعية الإخبارية (naweayh.xyz).</p>
          <div className="flex items-center gap-4">
            <span>حقوق النشر محفوظة</span>
            <span>•</span>
            <span>النسخة 2.0 Editorial</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
