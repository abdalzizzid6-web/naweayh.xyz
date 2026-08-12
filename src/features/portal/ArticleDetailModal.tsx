import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { NewsArticle } from '../../types';
import { newsService } from '../../services/newsService';
import { TTSSpeechService } from '../../ai-engine';
import {
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  Check,
  Eye,
  Clock,
  Sparkles,
  MapPin,
  Building,
  User,
  Tag,
  Type,
  Sun,
  Moon,
  Coffee,
  MessageSquare,
  ChevronLeft,
  Link,
  Layers,
} from 'lucide-react';

interface ArticleDetailModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: (id: string) => void;
  onBookmark: (id: string) => void;
  onOpenArticle?: (article: NewsArticle) => void;
}

type FontSize = 'sm' | 'base' | 'lg' | 'xl';
type ReaderTheme = 'light' | 'sepia' | 'dark';

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  isOpen,
  onClose,
  onShare,
  onBookmark,
  onOpenArticle,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Reader Customization State
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('light');

  useEffect(() => {
    if (!isOpen) {
      TTSSpeechService.stop();
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  if (!article) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    onShare(article.id);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareNative = (platform?: string) => {
    const text = `${article.title}\n${window.location.href}`;
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
    onShare(article.id);
  };

  const handleBookmarkToggle = () => {
    setBookmarked(!bookmarked);
    onBookmark(article.id);
  };

  const toggleAudio = () => {
    if (isPlayingAudio) {
      TTSSpeechService.stop();
      setIsPlayingAudio(false);
    } else {
      const textToRead = `${article.title}. ${article.summary}. ${article.content}`;
      const started = TTSSpeechService.speak(textToRead, () => setIsPlayingAudio(false));
      setIsPlayingAudio(started);
    }
  };

  // Get Related Articles
  const relatedArticles = newsService
    .getArticles(article.category, undefined, undefined, false, false, { page: 1, limit: 3 })
    .data.filter((a) => a.id !== article.id);

  // Reader theme classes
  const themeClasses = {
    light: 'bg-white text-slate-900 border-slate-200',
    sepia: 'bg-[#fbf0d9] text-[#433422] border-[#e8d2b0]',
    dark: 'bg-slate-950 text-slate-100 border-slate-800',
  }[readerTheme];

  const fontSizeClass = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose',
  }[fontSize];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="4xl">
      <div dir="rtl" className={`space-y-6 -mt-2 transition-colors duration-200 rounded-xl p-2 ${readerTheme === 'dark' ? 'dark' : ''}`}>
        
        {/* 1. Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
          <span>الرئيسية</span>
          <ChevronLeft className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{article.category}</span>
          {article.subCategory && (
            <>
              <ChevronLeft className="w-3 h-3 text-slate-400" />
              <span>{article.subCategory}</span>
            </>
          )}
          <ChevronLeft className="w-3 h-3 text-slate-400" />
          <span className="truncate max-w-xs">{article.title}</span>
        </div>

        {/* 2. Top Header Meta & Reader Mode Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="indigo">{article.category}</Badge>
            <Badge variant="sky">{article.country}</Badge>
            {article.isBreaking && <Badge variant="rose">⚡ عاجل</Badge>}
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.publishDate}
            </span>
          </div>

          {/* Reader Preferences Bar */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Font Size Adjuster */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Type className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <button
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'sm' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'base' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'lg' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xl')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'xl' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}
              >
                A++
              </button>
            </div>

            {/* Reader Theme Switcher */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setReaderTheme('light')}
                className={`p-1 rounded-lg ${readerTheme === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                title="وضع نهاري"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReaderTheme('sepia')}
                className={`p-1 rounded-lg ${readerTheme === 'sepia' ? 'bg-amber-700 text-white' : 'text-amber-800'}`}
                title="وضع دافئ مريح"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReaderTheme('dark')}
                className={`p-1 rounded-lg ${readerTheme === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                title="وضع ليلي"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Headline & Source Info */}
        <div className="space-y-3">
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <img
                src={article.sources[0]?.logo}
                alt={article.sources[0]?.name}
                className="w-5 h-5 rounded-full object-cover border"
              />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {article.sources[0]?.name || 'المصدر الرئيسي'}
              </span>
              {article.author && (
                <>
                  <span>•</span>
                  <span>بقلم: {article.author}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                {article.viewsCount.toLocaleString('ar-EG')} قراءة
              </span>
              <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                موثوقية {article.trustScore}%
              </span>
            </div>
          </div>
        </div>

        {/* 4. Action Toolbar (TTS, Bookmark, Share) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-3.5 rounded-2xl shadow-md">
          <div className="flex items-center gap-2">
            <Button
              variant={isPlayingAudio ? 'primary' : 'outline'}
              size="sm"
              onClick={toggleAudio}
              className="text-xs font-bold gap-1.5"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400 animate-pulse" />
                  إيقاف القراءة الصوتية
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  استمع للمقال بالذكاء الاصطناعي
                </>
              )}
            </Button>
            {isPlayingAudio && (
              <span className="text-xs text-indigo-300 font-bold animate-pulse hidden sm:inline">
                جاري التوليد الصوتي الفوري...
              </span>
            )}
          </div>

          {/* Share & Bookmark Options */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleShareNative('whatsapp')}
              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
            >
              واتساب
            </button>
            <button
              onClick={() => handleShareNative('telegram')}
              className="px-2.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold transition-all"
            >
              تليجرام
            </button>
            <button
              onClick={() => handleShareNative('twitter')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              منصة X
            </button>
            <Button
              variant={bookmarked ? 'primary' : 'outline'}
              size="sm"
              onClick={handleBookmarkToggle}
              className="text-xs"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
              {bookmarked ? 'محفوظ' : 'حفظ'}
            </Button>
          </div>
        </div>

        {/* 5. Main Cover Image */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video max-h-96 shadow-md">
          <img
            src={article.mainImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            تغطية صحفية موثوقة بنسبة {article.trustScore}%
          </div>
        </div>

        {/* 6. AI Executive Summary Card */}
        <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-800/60 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            الملخص التنفيذي بالذكاء الاصطناعي (AI Summary)
          </div>
          <p className="text-sm text-slate-200 font-semibold leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* 7. Customizable Article Body */}
        <div className={`p-6 rounded-2xl border ${themeClasses} ${fontSizeClass} space-y-4 whitespace-pre-line shadow-xs font-sans`}>
          {article.content}
        </div>

        {/* 8. Multi-Source Coverage Section (تغطية متعددة المصادر) */}
        {article.sources && article.sources.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  تغطية متعددة المصادر لهذا الحدث ({article.sources.length} مصادر إخبارية)
                </h3>
              </div>
              <span className="text-xs text-slate-500">منظومة الدمج وإلغاء التكرار (Deduplication)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.sources.map((src) => (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all group shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={src.logo}
                      alt={src.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors block">
                        {src.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{src.publishedAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="emerald" className="text-[10px]">
                      {src.reliabilityScore}%
                    </Badge>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 9. Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              أخبار وموضوعات ذات صلة
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onOpenArticle && onOpenArticle(rel)}
                  className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
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
      </div>
    </Modal>
  );
};
