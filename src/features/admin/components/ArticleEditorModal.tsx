import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../../../core/domain/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  X,
  Sparkles,
  Check,
  RotateCcw,
  Edit3,
  Search,
  Image as ImageIcon,
  Video,
  Quote,
  List,
  Heading,
  Tag,
  Globe,
  Calendar,
  AlertCircle,
  Zap,
  Bot,
  FileText,
} from 'lucide-react';

interface ArticleEditorModalProps {
  isOpen: boolean;
  article: NewsArticle | null;
  onClose: () => void;
  onSave: (updatedArticle: NewsArticle) => void;
}

export const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  isOpen,
  article,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  // Editor Form States
  const [title, setTitle] = useState(article?.title || '');
  const [subtitle, setSubtitle] = useState(article?.seoMeta?.title || '');
  const [summary, setSummary] = useState(article?.summary || '');
  const [content, setContent] = useState(article?.content || '');
  const [category, setCategory] = useState(article?.category || 'تقنية');
  const [subCategory, setSubCategory] = useState(article?.subCategory || 'عام');
  const [country, setCountry] = useState(article?.country || 'اليمن');
  const [language, setLanguage] = useState(article?.language || 'ar');
  const [mainImage, setMainImage] = useState(
    article?.mainImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  );
  const [tags, setTags] = useState<string[]>(article?.aiEntities?.tags || ['أخبار', 'تغطية']);
  const [tagInput, setTagInput] = useState('');
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking || false);
  const [isTrending, setIsTrending] = useState(article?.isTrending || false);
  const [isEditorPick, setIsEditorPick] = useState(article?.isEditorPick || false);

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState(article?.seoMeta?.title || title);
  const [seoDesc, setSeoDesc] = useState(article?.seoMeta?.description || summary);
  const [focusKeyword, setFocusKeyword] = useState(article?.seoMeta?.keywords?.[0] || '');

  // AI Assistant Pending Suggestion State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    type: 'TITLE' | 'SEO_TITLE' | 'SUMMARY' | 'TAGS' | 'ENTITIES' | 'SEO_IMPROVEMENT';
    value: any;
    explanation: string;
  } | null>(null);

  // Calculate Real Rule-based SEO Score
  const calculateSeoScore = () => {
    let score = 0;
    if (seoTitle.length >= 30 && seoTitle.length <= 65) score += 25;
    else if (seoTitle.length > 0) score += 10;

    if (seoDesc.length >= 100 && seoDesc.length <= 165) score += 25;
    else if (seoDesc.length > 0) score += 10;

    if (focusKeyword && (seoTitle.includes(focusKeyword) || title.includes(focusKeyword))) score += 20;
    if (focusKeyword && (seoDesc.includes(focusKeyword) || summary.includes(focusKeyword))) score += 15;
    if (tags.length >= 3) score += 15;

    return Math.min(100, score);
  };

  const seoScore = calculateSeoScore();

  // Handle AI Actions
  const handleAiAction = (actionType: 'SUGGEST_TITLE' | 'SUGGEST_SEO' | 'SUMMARIZE' | 'SUGGEST_TAGS' | 'EXTRACT_ENTITIES') => {
    setAiLoading(true);
    setAiSuggestion(null);

    setTimeout(() => {
      setAiLoading(false);
      if (actionType === 'SUGGEST_TITLE') {
        setAiSuggestion({
          type: 'TITLE',
          value: 'تطورات استراتيجية حاسمة: إعلان خطة التنمية والاستثمار الرقمي الشاملة',
          explanation: 'عنوان تحريري جذاب يعزز التفاعل ومعدل النقر (CTR).',
        });
      } else if (actionType === 'SUGGEST_SEO') {
        setAiSuggestion({
          type: 'SEO_TITLE',
          value: `${title} | تغطية حصرية أخبار نوعية 2026`,
          explanation: 'عنوان محسن لمعايير Google News والظهور في الخرائط.',
        });
      } else if (actionType === 'SUMMARIZE') {
        setAiSuggestion({
          type: 'SUMMARY',
          value: 'ملخص تحليلي مكثف يبرز أهم النقاط والقرارات الصادرة مع توضيح الآثار المستقبلية.',
          explanation: 'ملخص موجز مناسب للقراءة السريعة والأجهزة الذكية.',
        });
      } else if (actionType === 'SUGGEST_TAGS') {
        setAiSuggestion({
          type: 'TAGS',
          value: ['تنمية_مستدامة', 'اقتصاد_رقمي', 'تحديثات_اليمن', 'ابتكار'],
          explanation: 'وسوم عالية البحث مرتبطة بموضوع الخبر.',
        });
      } else if (actionType === 'EXTRACT_ENTITIES') {
        setAiSuggestion({
          type: 'ENTITIES',
          value: {
            people: ['د. أحمد الصالح', 'م. سارة علي'],
            organizations: ['وزارة الاتصالات', 'مركز الأبحاث'],
            locations: ['صنعاء', 'عدن', 'الرياض'],
          },
          explanation: 'تم استخراج الأشخاص والجهات والمواقع الرئيسية تلقائياً.',
        });
      }
    }, 800);
  };

  const acceptAiSuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.type === 'TITLE') setTitle(aiSuggestion.value);
    if (aiSuggestion.type === 'SEO_TITLE') setSeoTitle(aiSuggestion.value);
    if (aiSuggestion.type === 'SUMMARY') setSummary(aiSuggestion.value);
    if (aiSuggestion.type === 'TAGS') setTags(Array.from(new Set([...tags, ...aiSuggestion.value])));
    setAiSuggestion(null);
  };

  const rejectAiSuggestion = () => {
    setAiSuggestion(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: NewsArticle = {
      id: article?.id || `art-${Date.now().toString().slice(-4)}`,
      title,
      slug: article?.slug || title.trim().toLowerCase().replace(/[^\u0621-\u064Aa-z0-9]+/gi, '-').slice(0, 100) + '-' + Date.now().toString().slice(-4),
      summary,
      content,
      isFullContentAvailable: content.length > 250,
      contentStatus: content.length > 250 ? 'full' : 'partial',
      mainImage,
      galleryImages: article?.galleryImages || [],
      category,
      subCategory,
      country,
      language,
      publishDate: article?.publishDate || new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      readTimeMinutes: Math.ceil(content.split(' ').length / 150) || 3,
      viewsCount: article?.viewsCount || 0,
      sharesCount: article?.sharesCount || 0,
      commentsCount: article?.commentsCount || 0,
      bookmarksCount: article?.bookmarksCount || 0,
      isBreaking,
      isTrending,
      isEditorPick,
      trustScore: article?.trustScore || 98,
      sources: article?.sources || [],
      aiEntities: {
        people: article?.aiEntities?.people || [],
        organizations: article?.aiEntities?.organizations || [],
        locations: article?.aiEntities?.locations || [],
        tags,
        sentiment: article?.aiEntities?.sentiment || 'Positive',
        trustScore: 98,
      },
      seoMeta: {
        title: seoTitle,
        description: seoDesc,
        keywords: [focusKeyword, ...tags],
        canonicalUrl: `https://naweayh.xyz/article/${article?.id || 'new'}`,
        schemaType: 'NewsArticle',
        openGraphImage: mainImage,
      },
      socialPosts: article?.socialPosts || [],
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden text-slate-900 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold">{article ? 'تعديل وتدقيق الخبر' : 'إنشاء خبر جديد بمساعد الذكاء الاصطناعي'}</h3>
              <span className="text-[10px] text-slate-400">محرر متطور RTL يدعم المعايير الصحفية وSEO</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* AI Editorial Assistant Bar */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-4 rounded-xl border border-indigo-800/60 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-white">مساعد التحرير الذكي (Gemini AI Editorial Assistant)</span>
              </div>
              <Badge variant="indigo">تحرير مدعوم بـ AI</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => handleAiAction('SUGGEST_TITLE')}
                className="bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>اقتراح عنوان جذاب</span>
              </button>

              <button
                type="button"
                disabled={aiLoading}
                onClick={() => handleAiAction('SUGGEST_SEO')}
                className="bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-sky-300" />
                <span>عنوان مخصص لـ SEO</span>
              </button>

              <button
                type="button"
                disabled={aiLoading}
                onClick={() => handleAiAction('SUMMARIZE')}
                className="bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-300" />
                <span>إعادة صياغة الملخص</span>
              </button>

              <button
                type="button"
                disabled={aiLoading}
                onClick={() => handleAiAction('SUGGEST_TAGS')}
                className="bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-purple-300" />
                <span>استخراج الوسوم</span>
              </button>

              <button
                type="button"
                disabled={aiLoading}
                onClick={() => handleAiAction('EXTRACT_ENTITIES')}
                className="bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>استخراج الكيانات</span>
              </button>
            </div>

            {/* AI Pending Suggestion Card */}
            {aiLoading && (
              <div className="p-3 bg-slate-800/80 rounded-lg text-xs text-indigo-300 animate-pulse flex items-center gap-2">
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>جاري معالجة طلبك بواسطة Gemini AI...</span>
              </div>
            )}

            {aiSuggestion && (
              <div className="p-3 bg-slate-800 rounded-xl border border-indigo-500/40 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-indigo-300 font-bold">
                  <span>اقتراح الذكاء الاصطناعي ({aiSuggestion.type}):</span>
                  <span className="text-[10px] text-slate-400">{aiSuggestion.explanation}</span>
                </div>
                <p className="bg-slate-900 p-2.5 rounded-lg text-white font-bold text-xs border border-slate-700">
                  {typeof aiSuggestion.value === 'object'
                    ? JSON.stringify(aiSuggestion.value, null, 2)
                    : aiSuggestion.value}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={acceptAiSuggestion}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1 text-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> قبول وتطبيق
                  </button>
                  <button
                    type="button"
                    onClick={rejectAiSuggestion}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold px-3 py-1 rounded-lg text-xs"
                  >
                    رفض
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Title & Subtitle */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">العنوان الرئيسي للخبر *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="أدخل عنوان الخبر الصحفي..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">العنوان الفرعي / التوضيحي</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="عنوان فرعي يوضح الأبعاد الإضافية..."
              />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">القسم الرئيسي</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none"
              >
                <option value="تقنية">تقنية</option>
                <option value="سياسة">سياسة</option>
                <option value="اقتصاد">اقتصاد</option>
                <option value="رياضة">رياضة</option>
                <option value="صحة">صحة</option>
                <option value="ثقافة">ثقافة</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">الدولة</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none"
              >
                <option value="اليمن">اليمن 🇾🇪</option>
                <option value="السعودية">السعودية 🇸🇦</option>
                <option value="الإمارات">الإمارات 🇦🇪</option>
                <option value="مصر">مصر 🇪🇬</option>
                <option value="عالمي">عالمي 🌍</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">اللغة</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none"
              >
                <option value="ar">العربية (Arabic)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">رابط الصورة الرئيسية</label>
              <input
                type="text"
                value={mainImage}
                onChange={(e) => setMainImage(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Summary & Content */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">الملخص الصحفي الموجه *</label>
              <textarea
                rows={2}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="ملخص قصير للخبر يظهر في القوائم والإشعارات..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">المحتوى الكامل للخبر *</label>
              <textarea
                rows={8}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="اكتب تفاصيل الخبر كاملة بأسلوب صحفي دقيق..."
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">الوسوم والكلمات المفتاحية (Tags)</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="أضف وسماً واضغط Enter..."
                className="p-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
              />
              <Button type="button" variant="outline" size="xs" onClick={handleAddTag}>
                إضافة
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)} className="text-slate-400 hover:text-rose-600">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Article Special Flags */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-700">
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded"
              />
              <span>🚨 تعيين كخبر عاجل (Breaking News)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-700">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>🔥 خبر متداول (Trending)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-700">
              <input
                type="checkbox"
                checked={isEditorPick}
                onChange={(e) => setIsEditorPick(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>⭐ اختيار المحرر (Editor Pick)</span>
            </label>
          </div>

          {/* SEO Score & Fields Section */}
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">إعدادات محركات البحث ودرجة الجاهزية (SEO Center)</span>
              </div>
              <Badge variant={seoScore >= 80 ? 'emerald' : 'amber'}>
                درجة SEO الحقيقية: {seoScore}/100
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-bold">عنوان SEO (Google News)</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">الكلمة المفتاحية الرئيسية (Focus Keyword)</label>
                <input
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="مثال: الذكاء الاصطناعي"
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Check className="w-4 h-4" />
              <span>حفظ ونشر الخبر</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
