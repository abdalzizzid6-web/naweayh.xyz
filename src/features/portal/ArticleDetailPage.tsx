import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../../types';
import { newsService } from '../../services/newsService';
import { TTSSpeechService } from '../../ai-engine';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  Eye,
  Clock,
  Sparkles,
  ChevronLeft,
  Printer,
  Layers,
  ArrowRight,
  MapPin,
  Tag,
  Check,
} from 'lucide-react';

interface ArticleDetailPageProps {
  slug: string;
  onNavigateHome: () => void;
  onOpenArticleBySlug: (slug: string) => void;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  slug,
  onNavigateHome,
  onOpenArticleBySlug,
}) => {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Record view & history
    const found = newsService.getArticles().data.find((a) => a.slug === slug);
    if (found) {
      setArticle(found);
      newsService.recordReadingHistory(found);
      setIsBookmarked(found.isBookmarked || false);
    }
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      TTSSpeechService.stop();
    };
  }, []);

  if (!article) {
    return (
      <div dir="rtl" className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          جاري تحميل الخبر أو لم يتم العثور على المقال
        </h2>
        <p className="text-sm text-slate-500">
          تأكد من صحة الرابط أو عد للصفحة الرئيسية.
        </p>
        <Button variant="primary" onClick={onNavigateHome} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </Button>
      </div>
    );
  }

  const handleShareNative = (platform?: string) => {
    const pageUrl = window.location.href;
    const shareText = `${article.title}\n${pageUrl}`;

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(article.title)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
    } else {
      navigator.clipboard.writeText(pageUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    newsService.shareArticle(article.id);
  };

  const handleToggleBookmark = () => {
    newsService.toggleBookmark(article.id);
    setIsBookmarked(!isBookmarked);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      TTSSpeechService.stop();
      setIsPlayingAudio(false);
    } else {
      const text = `${article.title}. ${article.summary}. ${article.content}`;
      const started = TTSSpeechService.speak(text, () => setIsPlayingAudio(false));
      setIsPlayingAudio(started);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const relatedArticles = newsService
    .getArticles(article.category, undefined, undefined, false, false, { page: 1, limit: 4 })
    .data.filter((a) => a.id !== article.id);

  return (
    <article dir="rtl" className="max-w-4xl mx-auto space-y-8 pb-20 font-sans relative">
      
      {/* Scroll Reading Progress Bar at top of viewport */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-200/60 dark:bg-slate-800/60 z-50 backdrop-blur-xs">
        <div
          className="h-full bg-gradient-to-l from-indigo-500 via-indigo-600 to-sky-500 transition-all duration-75 shadow-xs"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>

        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>أخبار نوعية</span>
          <ChevronLeft className="w-3 h-3" />
          <span className="font-semibold text-indigo-600">{article.category}</span>
          <ChevronLeft className="w-3 h-3" />
          <span className="truncate max-w-xs">{article.title}</span>
        </div>
      </div>

      {/* Article Header & Title */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="indigo">{article.category}</Badge>
          <Badge variant="sky">{article.country}</Badge>
          {article.isBreaking && <Badge variant="rose">⚡ عاجل</Badge>}
          <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5" />
            نُشر بتاريخ {article.publishDate}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1 font-mono mr-3">
            <Layers className="w-3.5 h-3.5" />
            مدة القراءة: {Math.max(1, Math.ceil((article.content?.split(/\s+/).length || 0) / 200))} دقائق
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
          {article.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-semibold leading-relaxed border-r-4 border-indigo-600 pr-4 py-1">
          {article.summary}
        </p>

        {/* Source & Metadata Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={article.sources[0]?.logo}
              alt={article.sources[0]?.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {article.sources[0]?.name || 'المصدر الرئيسي'}
              </span>
              <span className="text-[11px] text-slate-400 block">
                بقلم: {article.author || 'محرر الأخبار'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4 text-emerald-500" />
              {article.viewsCount.toLocaleString('ar-EG')} قراءة
            </span>
            <span className="flex items-center gap-1 font-bold text-indigo-600">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              موثوقية {article.trustScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Cover Image */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video shadow-xl">
        <img
          src={article.mainImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          تغطية مصدقة ومستخرجة إلكترونياً | المصدر الأصلي
        </div>
      </div>

      {/* Interactive Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
        <Button
          variant={isPlayingAudio ? 'primary' : 'outline'}
          size="sm"
          onClick={handleToggleAudio}
          className="text-xs font-bold gap-2"
        >
          {isPlayingAudio ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-400 animate-pulse" />
              إيقاف الاستماع
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-indigo-400" />
              استمع للمقال بالذكاء الاصطناعي
            </>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShareNative('whatsapp')}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
          >
            واتساب
          </button>
          <button
            onClick={() => handleShareNative('telegram')}
            className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold transition-all"
          >
            تليجرام
          </button>
          <button
            onClick={() => handleShareNative('twitter')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            منصة X
          </button>
          <Button
            variant={isBookmarked ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleBookmark}
            className="text-xs"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            {isBookmarked ? 'محفوظ' : 'حفظ'}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs" title="طباعة المقال">
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Article Body Text with TOC */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Table of Contents Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              جدول المحتويات
            </h3>
            <ul className="space-y-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <a href="#summary" className="hover:text-indigo-600 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  الملخص
                </a>
              </li>
              <li>
                <a href="#content" className="hover:text-indigo-600 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  التفاصيل الكاملة
                </a>
              </li>
              <li>
                <a href="#sources" className="hover:text-indigo-600 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  تغطية متعددة المصادر
                </a>
              </li>
            </ul>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          <div id="content" className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-relaxed whitespace-pre-line font-sans">
            {article.content}
          </div>

          {/* Story Cluster Section */}
          {article.sources && article.sources.length > 0 && (
            <div id="sources" className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  تغطية متعددة المصادر (Story Cluster)
                </h3>
                <span className="text-xs text-slate-400">تجميع الروابط والمصادر الموثوقة</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {article.sources.map((src) => (
                  <a
                    key={src.id}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={src.logo}
                        alt={src.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 block">
                          {src.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{src.publishedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-indigo-600 font-bold">
                      اقرأ بالمصدر الأصلي
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tags & AI Entities */}
      {article.aiEntities && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 ml-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            الوسوم والكيانات:
          </span>
          {article.aiEntities.tags.map((tag) => (
            <span
              key={tag}
              className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs px-3 py-1 rounded-full font-bold border border-indigo-200 dark:border-indigo-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Related News */}
      {relatedArticles.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            أخبار ذات صلة
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onOpenArticleBySlug(rel.slug)}
                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-all space-y-2 group shadow-xs"
              >
                <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={rel.mainImage}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 line-clamp-2 leading-snug">
                  {rel.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
