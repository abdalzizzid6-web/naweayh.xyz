import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { newsService } from '../../services/newsService';
import { NewsArticle } from '../../types';
import {
  Smartphone,
  Wifi,
  Battery,
  Bell,
  Bookmark,
  Share2,
  Moon,
  Sun,
  ShieldCheck,
  ChevronRight,
  Send,
  Zap,
  Globe,
  Flame,
  Search,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const MobileAppSimulator: React.FC = () => {
  const [deviceType, setDeviceType] = useState<'ios' | 'android'>('ios');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'breaking' | 'saved' | 'settings'>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Push Alert Overlay Simulator State
  const [pushAlert, setPushAlert] = useState<{ title: string; body: string } | null>(null);

  const articles = newsService.getArticles(selectedCategory, undefined, undefined, false, false, { page: 1, limit: 8 }).data;
  const breakingArticles = newsService.getBreakingNews();

  const handleSimulatePushAlert = () => {
    const randomBreaking = breakingArticles[0] || articles[0];
    if (randomBreaking) {
      setPushAlert({
        title: '⚡ خبر عاجل | ' + randomBreaking.title,
        body: randomBreaking.summary,
      });
      setTimeout(() => {
        setPushAlert(null);
      }, 5000);
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Top Controls Header */}
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            محاكي تطبيق الهواتف الذكية (iOS & Android)
          </h2>
          <p className="text-xs text-slate-500">
            اختبر تجربة المستخدم الفائقة لتطبيق "أخبار نوعية" لملايين المستخدمين على أجهزة آيفون وأندرويد.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Toggle */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs font-semibold">
            <button
              onClick={() => setDeviceType('ios')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                deviceType === 'ios' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              iPhone 16 Pro
            </button>
            <button
              onClick={() => setDeviceType('android')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                deviceType === 'android' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Galaxy S25 Ultra
            </button>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="تبديل وضع النهار/الليل داخل المحاكي"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </Button>

          {/* Trigger Live Push Notification */}
          <Button variant="primary" size="sm" onClick={handleSimulatePushAlert}>
            <Send className="w-4 h-4 ml-1.5" />
            اختبار إشعار عاجل Push
          </Button>
        </div>
      </Card>

      {/* Main Simulator Phone Container */}
      <div className="flex justify-center items-center py-4">
        <div
          className={`relative transition-all duration-300 shadow-2xl border-8 ${
            deviceType === 'ios'
              ? 'w-[360px] h-[720px] rounded-[50px] border-slate-900 bg-slate-900 ring-1 ring-slate-800'
              : 'w-[370px] h-[730px] rounded-[36px] border-slate-800 bg-slate-800 ring-1 ring-slate-700'
          }`}
        >
          {/* Dynamic Island / Camera Notch */}
          {deviceType === 'ios' ? (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-between px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
              <div className="w-2 h-2 rounded-full bg-indigo-900/50" />
            </div>
          ) : (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-50 border border-slate-800" />
          )}

          {/* Inside Phone Screen Frame */}
          <div
            className={`w-full h-full rounded-[42px] overflow-hidden flex flex-col justify-between pt-8 pb-4 relative transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
            }`}
          >
            {/* Status Bar */}
            <div className="px-6 pt-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 z-40 select-none">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4" />
              </div>
            </div>

            {/* Push Alert Popup Overlay Simulation */}
            {pushAlert && (
              <div className="absolute top-10 inset-x-3 z-50 animate-in fade-in slide-in-from-top duration-300">
                <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-rose-600 rounded-xl shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-400 uppercase">أخبار نوعية • الآن</span>
                    </div>
                    <h5 className="text-xs font-bold leading-tight line-clamp-1">{pushAlert.title}</h5>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{pushAlert.body}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Screen Content Body */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 scrollbar-none">
              {/* If an article is open in reader view inside phone */}
              {selectedArticle ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="flex items-center gap-1 text-xs text-indigo-400 font-semibold py-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    العودة للأخبار
                  </button>

                  <Badge variant="indigo">{selectedArticle.category}</Badge>

                  <h2 className="text-base font-bold leading-snug">{selectedArticle.title}</h2>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {selectedArticle.sources[0]?.name}
                    </span>
                    <span>{selectedArticle.publishDate}</span>
                  </div>

                  <img
                    src={selectedArticle.mainImage}
                    alt={selectedArticle.title}
                    className="w-full aspect-video object-cover rounded-xl border border-slate-800"
                  />

                  <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                    {selectedArticle.content}
                  </p>
                </div>
              ) : (
                /* Regular Feed View */
                <>
                  {/* App Header Bar */}
                  <div className="flex items-center justify-between pt-1 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                        ن
                      </div>
                      <span className="font-bold text-sm tracking-tight">أخبار نوعية</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Bell className="w-4 h-4 cursor-pointer hover:text-white" onClick={handleSimulatePushAlert} />
                      <Search className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Category Horizontal Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    {['الكل', 'تقنية', 'اقتصاد', 'سياسة', 'رياضة'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                          selectedCategory === cat
                            ? 'bg-indigo-600 text-white'
                            : isDarkMode
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Breaking Banner inside phone */}
                  {breakingArticles.length > 0 && (
                    <div
                      onClick={() => setSelectedArticle(breakingArticles[0])}
                      className="bg-gradient-to-r from-rose-900/40 to-slate-900 border border-rose-800/50 rounded-xl p-2.5 cursor-pointer flex items-center gap-2.5"
                    >
                      <Zap className="w-4 h-4 text-rose-500 fill-current animate-bounce shrink-0" />
                      <div className="flex-1 text-right">
                        <span className="text-[10px] font-bold text-rose-400">عاجل • الآن</span>
                        <h4 className="text-xs font-bold line-clamp-1">{breakingArticles[0].title}</h4>
                      </div>
                    </div>
                  )}

                  {/* Articles Stream */}
                  <div className="space-y-2.5 pt-1">
                    {articles.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedArticle(item)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-2.5 items-center ${
                          isDarkMode
                            ? 'bg-slate-900/80 border-slate-800/80 hover:border-indigo-500/50'
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <img
                          src={item.mainImage}
                          alt={item.title}
                          className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-800"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-indigo-400 font-semibold">{item.category}</span>
                            <span className="text-slate-400">{item.publishDate.split(' ')[1] || 'الآن'}</span>
                          </div>
                          <h4 className="text-xs font-bold leading-tight line-clamp-2">{item.title}</h4>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              {item.sources[0]?.name}
                            </span>
                            <span className="bg-emerald-950/60 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                              {item.trustScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Phone Bottom Navigation Bar */}
            <div
              className={`px-6 py-2 border-t flex items-center justify-around text-[10px] font-medium z-40 ${
                isDarkMode ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <button
                onClick={() => {
                  setActiveTab('feed');
                  setSelectedArticle(null);
                }}
                className={`flex flex-col items-center gap-0.5 ${activeTab === 'feed' ? 'text-indigo-500 font-bold' : ''}`}
              >
                <Globe className="w-4 h-4" />
                <span>الأخبار</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('breaking');
                  setSelectedArticle(null);
                }}
                className={`flex flex-col items-center gap-0.5 ${activeTab === 'breaking' ? 'text-rose-500 font-bold' : ''}`}
              >
                <Zap className="w-4 h-4" />
                <span>عاجل</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('saved');
                  setSelectedArticle(null);
                }}
                className={`flex flex-col items-center gap-0.5 ${activeTab === 'saved' ? 'text-indigo-500 font-bold' : ''}`}
              >
                <Bookmark className="w-4 h-4" />
                <span>المحفوظات</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
