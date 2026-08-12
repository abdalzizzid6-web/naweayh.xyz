import React from 'react';
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
  LayoutGrid
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';

export const PortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, currentUser, sidebarOpen, setSidebarOpen, navigate } = useApp();

  // Primary Editorial Categories
  const newsCategories = [
    { id: 'portal', label: 'الرئيسية' },
    { id: 'latest', label: 'آخر الأخبار' },
    { id: 'my_feed', label: 'أخبارك' },
    { id: 'yemen', label: 'اليمن' },
    { id: 'arab', label: 'العالم العربي' },
    { id: 'world', label: 'العالم' },
    { id: 'business', label: 'اقتصاد' },
    { id: 'tech', label: 'تقنية' },
    { id: 'sports', label: 'رياضة' },
    { id: 'video', label: 'فيديو' },
    { id: 'live', label: 'بث مباشر' },
  ];

  const currentDateArabic = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-700 selection:text-white" dir="rtl">
      
      {/* 1. Top Editorial Utility Header Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs border-b border-slate-800 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400 font-medium hidden sm:inline-block">
              {currentDateArabic}
            </span>
            <span className="hidden md:inline-block text-slate-600">•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              الطبعة العربية الرسمية — Naw3iya News
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-300 hidden lg:inline-block">
              تغطية موثوقة من <strong className="text-white">45+ مصدر إخباري متميز</strong>
            </span>
            <a href="https://naweayh.xyz" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              naweayh.xyz
            </a>
          </div>

        </div>
      </div>

      {/* 2. Main Brand Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          
          {/* Right: Hamburger + Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => {
                setActiveTab('portal');
                navigate('/');
              }}
            >
              <div className="w-11 h-11 bg-emerald-900 text-white font-black flex items-center justify-center text-xl rounded-xl shadow-md group-hover:bg-emerald-800 transition-colors">
                ن
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl text-slate-900 tracking-tight leading-none group-hover:text-emerald-800 transition-colors">
                  أخبار نوعية
                </span>
                <span className="text-[11px] text-emerald-700 font-extrabold uppercase tracking-widest leading-tight mt-1">
                  NAW3IYA NEWS NETWORK
                </span>
              </div>
            </div>
          </div>

          {/* Center Search Input Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="ابحث في الأخبار، المواضيع، والمصادر..."
                onClick={() => {
                  setActiveTab('portal');
                  navigate('/?search=true');
                }}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:bg-white text-sm rounded-xl pr-10 pl-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          {/* Left Actions: Notifications, Saved, Newsroom Switch, User */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setActiveTab('saved');
                navigate('/saved');
              }}
              className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-xl transition-colors relative"
              title="المقالات المحفوظة"
            >
              <Bookmark className="w-5 h-5" />
            </button>

            <button 
              onClick={() => {
                setActiveTab('portal');
              }}
              className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-xl transition-colors relative"
              title="الإشعارات"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-600 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Newsroom Control Switcher (For Authorized Users) */}
            {(currentUser.role === 'System Admin' || currentUser.role === 'Executive' || currentUser.role === 'Editor-in-Chief') && (
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors mr-2 shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>غرفة الأخبار</span>
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2.5 p-1">
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-2xs">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-slate-600" />
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 3. Secondary Section & Category Editorial Navigation Bar */}
        <nav className="bg-slate-50/80 border-t border-slate-200/80 overflow-x-auto scrollbar-none">
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
                  className={`px-3.5 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'border-emerald-700 text-emerald-800 bg-white shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around text-[10px] font-bold text-slate-600 shadow-lg">
        <button
          onClick={() => {
            setActiveTab('portal');
            navigate('/');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'portal' ? 'text-emerald-700' : 'hover:text-slate-900'
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
            activeTab === 'my_feed' ? 'text-emerald-700' : 'hover:text-slate-900'
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
            activeTab === 'topics' ? 'text-emerald-700' : 'hover:text-slate-900'
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
            activeTab === 'saved' ? 'text-emerald-700' : 'hover:text-slate-900'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span>المحفوظات</span>
        </button>
      </div>

      {/* 5. Global Editorial Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 text-xs border-t border-slate-800">
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
