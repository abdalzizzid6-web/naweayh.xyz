import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../../types';
import { newsService } from '../../services/newsService';
import { TTSSpeechService } from '../../ai-engine';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ArticleDetailSkeleton } from '../../components/news';
import { SEOHead } from '../../seo-engine/SEOHead';
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
  CheckCircle2,
  Calendar,
  Loader2,
  FileText,
  Radio,
  BookOpen
} from 'lucide-react';

interface ArticleDetailPageProps {
  slug: string;
  onNavigateHome: () => void;
  onOpenArticleBySlug: (slug: string) => void;
}

const DEFAULT_NEWS_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_SOURCE_LOGO = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=120&q=80';

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  slug,
  onNavigateHome,
  onOpenArticleBySlug,
}) => {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadArticle() {
      const found = await newsService.getArticleBySlugOrIdAsync(slug);
      if (isMounted) {
        setArticle(found);
        setIsBookmarked(found?.isBookmarked || false);
        setIsLoading(false);
      }
    }

    loadArticle();

    return () => {
      isMounted = false;
      TTSSpeechService.stop();
    };
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

  if (isLoading) {
    return (
      <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <ArticleDetailSkeleton />
      </div>
    );
  }

  if (!article) {
    return (
      <>
        <SEOHead is404={true} />
        <div dir="rtl" className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            لم يتم العثور على المقال
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            قد يكون المقال قد تم نقله أو أن الرابط غير صحيح. يمكنك العودة للصفحة الرئيسية وتصفح أحدث الأخبار.
          </p>
          <div className="pt-2">
            <Button variant="primary" onClick={onNavigateHome} className="gap-2 bg-emerald-800 hover:bg-emerald-700 px-6 py-2.5">
              <ArrowRight className="w-4 h-4" />
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </>
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
      const textToRead = `${article.title}. ${article.summary || ''}. ${(article.paragraphs || [article.content]).join('. ')}`;
      const started = TTSSpeechService.speak(textToRead, () => setIsPlayingAudio(false));
      setIsPlayingAudio(started);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isFull = Boolean(
    article.isFullContentAvailable ||
    article.contentStatus === 'full' ||
    article.contentClassification === 'FULL_PERMITTED_CONTENT' ||
    (article.paragraphs && article.paragraphs.length >= 3)
  );

  const paragraphsToRender = (article.paragraphs && article.paragraphs.length > 0)
    ? article.paragraphs
    : (article.content || article.summary || '')
        .replace(/<[^>]+>/g, '')
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

  const fontSizeClasses = {
    normal: 'text-base sm:text-lg leading-relaxed sm:leading-8',
    large: 'text-lg sm:text-xl leading-relaxed sm:leading-9',
    xlarge: 'text-xl sm:text-2xl leading-relaxed sm:leading-10',
  }[fontSize];

  const primarySource = article.sources?.[0];
  const originalUrl = article.originalArticleUrl || primarySource?.url || article.canonicalUrl;

  const relatedArticles = newsService
    .getArticles(article.category, undefined, undefined, false, false, { page: 1, limit: 4 })
    .data.filter((a) => a.id !== article.id);

  const mostReadSidebar = newsService.getMostReadNews(4).filter((a) => a.id !== article.id);

  return (
    <article dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20 font-sans relative">
      <SEOHead article={article} />
      
      {/* Scroll Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200/60 dark:bg-slate-800/60 z-50 backdrop-blur-2xs">
        <div
          className="h-full bg-emerald-600 transition-all duration-75 shadow-xs"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 pt-2">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>

        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>أخبار نوعية</span>
          <ChevronLeft className="w-3 h-3" />
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{article.category}</span>
          <ChevronLeft className="w-3 h-3 hidden sm:inline" />
          <span className="truncate max-w-xs hidden sm:inline">{article.title}</span>
        </div>
      </div>

      {/* Main Grid: 8 Cols Article Reading + 4 Cols Editorial Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header & Badges */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                {article.category}
              </Badge>
              {article.country && (
                <Badge variant="sky" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {article.country}
                </Badge>
              )}
              {article.isBreaking && <Badge variant="rose" className="bg-rose-600 text-white font-bold">⚡ عاجل</Badge>}
              
              {/* Content Availability Status Badge */}
              {isFull ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <BookOpen className="w-3 h-3" />
                  مقال كامل
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <FileText className="w-3 h-3" />
                  موجز إخباري
                </span>
              )}

              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono mr-auto">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(article.publishDate).toLocaleDateString('ar-YE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {article.title}
            </h1>

            {article.subheadline && (
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {article.subheadline}
              </p>
            )}

            {/* If partial, show lead summary callout; if full, render lead style */}
            {article.summary && (
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-semibold leading-relaxed border-r-4 border-emerald-800 pr-4 py-2 bg-slate-100/70 dark:bg-slate-900/70 rounded-l-xl">
                {article.summary}
              </p>
            )}

            {/* Source & Metadata Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-3">
                <img
                  src={primarySource?.logo || DEFAULT_SOURCE_LOGO}
                  alt={primarySource?.name || 'المصدر'}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_SOURCE_LOGO;
                  }}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      المصدر: {primarySource?.name || 'مصدر إخباري موثوق'}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    تحرير: {article.author || 'قسم الأخبار'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-bold">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  {article.viewsCount?.toLocaleString('ar-YE') || '1'} مشاهدة
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  مؤشر الثقة {article.trustScore || 95}%
                </span>
              </div>
            </div>
          </div>

          {/* Main Cover Image */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video shadow-sm bg-slate-950">
            <img
              src={article.mainImage || DEFAULT_NEWS_IMAGE}
              alt={article.title}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_NEWS_IMAGE;
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3.5 right-3.5 bg-slate-950/90 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              تغطية إخبارية مستقلة ومحققة إلكترونياً
            </div>
          </div>

          {/* Interactive Action Toolbar & Font Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md">
            <div className="flex items-center gap-2">
              <Button
                variant={isPlayingAudio ? 'primary' : 'outline'}
                size="sm"
                onClick={handleToggleAudio}
                className="text-xs font-bold gap-2 bg-emerald-800 hover:bg-emerald-700 border-none min-h-[36px]"
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-300 animate-pulse" />
                    إيقاف القراءة
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-300" />
                    استمع للمقال
                  </>
                )}
              </Button>

              {/* Font Resizing */}
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 gap-1 text-xs">
                <span className="text-slate-400 text-[11px] ml-1">الخط:</span>
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-1.5 py-0.5 rounded ${fontSize === 'normal' ? 'bg-emerald-800 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  عادي
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-1.5 py-0.5 rounded ${fontSize === 'large' ? 'bg-emerald-800 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  كبير
                </button>
                <button
                  onClick={() => setFontSize('xlarge')}
                  className={`px-1.5 py-0.5 rounded ${fontSize === 'xlarge' ? 'bg-emerald-800 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  أكبر
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShareNative('whatsapp')}
                className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
                title="واتساب"
              >
                واتساب
              </button>
              <button
                onClick={() => handleShareNative('telegram')}
                className="px-2.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold transition-all"
                title="تليجرام"
              >
                تليجرام
              </button>
              <button
                onClick={() => handleShareNative('twitter')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                title="منصة X"
              >
                X
              </button>
              <Button
                variant={isBookmarked ? 'primary' : 'outline'}
                size="sm"
                onClick={handleToggleBookmark}
                className={`text-xs min-h-[36px] ${isBookmarked ? 'bg-emerald-800 border-none' : ''}`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'محفوظ' : 'حفظ'}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs min-h-[36px]" title="طباعة المقال">
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Article Text Body */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              {paragraphsToRender.map((paragraph, index) => (
                <p
                  key={index}
                  className={`text-slate-800 dark:text-slate-100 font-sans tracking-normal ${fontSizeClasses}`}
                >
                  {paragraph}
                </p>
              ))}

              {/* If partial content, display graceful source attribution callout */}
              {!isFull && originalUrl && (
                <div className="mt-8 p-5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      هل ترغب في قراءة التغطية الموسعة من المصدر؟
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      المقال معروض كموجز إخباري معتمد. يمكنك متابعة التغطية الكاملة على موقع {primarySource?.name || 'المصدر الأصلي'}.
                    </p>
                  </div>
                  <a
                    href={originalUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap shadow-xs"
                  >
                    <span>فتح المقال في {primarySource?.name || 'الموقع الأصلي'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Story Sources Section */}
            {article.sources && article.sources.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    المصادر والتغطية المعتمدة
                  </h3>
                  <span className="text-[11px] text-slate-400">تغطية مباشرة موثقة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {article.sources.map((src) => (
                    <a
                      key={src.id}
                      href={src.url || originalUrl || '#'}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-600 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={src.logo || DEFAULT_SOURCE_LOGO}
                          alt={src.name}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_SOURCE_LOGO;
                          }}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 block">
                            {src.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {src.publishedAt ? new Date(src.publishedAt).toLocaleDateString('ar-YE') : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                        المصدر
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags & AI Entities */}
          {article.aiEntities?.tags && article.aiEntities.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 ml-2">
                <Tag className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                المواضيع والوسوم:
              </span>
              {article.aiEntities.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs px-3 py-1 rounded-full font-bold border border-emerald-200 dark:border-emerald-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Editorial Sidebar Column (4 cols on Desktop) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Related In Category */}
          {relatedArticles.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                أخبار ذات صلة في {article.category}
              </h3>

              <div className="space-y-3">
                {relatedArticles.slice(0, 3).map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onOpenArticleBySlug(rel.slug)}
                    className="p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer transition-all flex gap-3 items-center group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0">
                      <img
                        src={rel.mainImage || DEFAULT_NEWS_IMAGE}
                        alt={rel.title}
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                        {new Date(rel.publishDate).toLocaleDateString('ar-YE', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most Read Leaderboard */}
          {mostReadSidebar.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Eye className="w-4 h-4 text-emerald-600" />
                الأكثر قراءة الآن
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {mostReadSidebar.map((art, idx) => (
                  <div
                    key={art.id}
                    onClick={() => onOpenArticleBySlug(art.slug)}
                    className="py-2.5 flex gap-2.5 items-start cursor-pointer group"
                  >
                    <span className="text-lg font-black text-slate-300 dark:text-slate-700 font-mono group-hover:text-emerald-600 transition-colors w-6 text-center leading-none pt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 line-clamp-2 leading-snug">
                        {art.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </aside>

      </div>
    </article>
  );
};
