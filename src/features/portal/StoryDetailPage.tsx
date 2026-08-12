import React, { useState, useEffect } from 'react';
import { storiesService, StoryCluster } from '../../services/storiesService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Globe, 
  Clock, 
  ShieldCheck, 
  Share2, 
  Bookmark, 
  ChevronRight, 
  ArrowRight, 
  Layers, 
  Radio, 
  ExternalLink,
  Sparkles,
  TrendingUp,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface StoryDetailPageProps {
  slug: string;
  onNavigateHome: () => void;
  onOpenArticleBySlug: (slug: string) => void;
}

export const StoryDetailPage: React.FC<StoryDetailPageProps> = ({ slug, onNavigateHome, onOpenArticleBySlug }) => {
  const [story, setStory] = useState<StoryCluster | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [relatedStories, setRelatedStories] = useState<StoryCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'sources' | 'articles'>('overview');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadStory() {
      setLoading(true);
      const data = await storiesService.getStoryBySlugOrId(slug);
      if (data && isMounted) {
        setStory(data);
        const tl = await storiesService.getStoryTimeline(data.id);
        if (isMounted) setTimeline(tl);
        const rel = await storiesService.getStoryRelated(data.id);
        if (isMounted) setRelatedStories(rel);
      }
      if (isMounted) setLoading(false);
    }
    loadStory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { isMounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">جاري تحليل وتجميع تفاصيل القصة الإخبارية...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">!</div>
          <h2 className="text-2xl font-bold text-slate-900">القصة غير موجودة أو تم أرشفتها</h2>
          <p className="text-slate-600">عذراً، لم نتمكن من العثور على القصة الإخبارية المطلوبة.</p>
          <Button onClick={onNavigateHome} variant="primary">العودة إلى الرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16" dir="rtl">
      {/* Breadcrumb / Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 transition-colors font-medium text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
              قصة إخبارية موحدة (Story Cluster)
            </span>
            <button 
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-xl border transition-colors ${isSaved ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              title="حفظ القصة"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: story.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('تم نسخ رابط القصة');
                }
              }}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              title="مشاركة القصة"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Story Header */}
      <header className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-emerald-500 text-white font-bold px-3 py-1">
              {story.category || 'أخبار عامة'}
            </Badge>
            <span className="text-slate-300 text-sm flex items-center gap-1">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {story.country || 'اليمن'}
            </span>
            <span className="text-slate-400 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" />
              آخر تحديث: {new Date(story.last_updated_at).toLocaleString('ar-SA')}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white tracking-tight">
            {story.title}
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed max-w-4xl">
            {story.summary}
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-700/80">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">التغطيات الإجمالية</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{story.articles_count || (story.articles?.length || 1)} مقال</div>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">المصادر المشاركة</div>
              <div className="text-2xl font-black text-blue-400 mt-1">{story.sources_count || (story.sources?.length || 1)} مصادر</div>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">مؤشر الأهمية</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{story.importance_score || '95'}%</div>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">حالة الحدث</div>
              <div className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                مستمر ومتجدد
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Participating Sources Chips Banner */}
      <section className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>غردت وأكدت الحدث {story.sources?.length || story.sources_count || 1} مصادر إخبارية رسمية:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {story.sources?.map((src: any) => (
              <div key={src.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shadow-2xs">
                {src.logo ? (
                  <img src={src.logo} alt={src.name} className="w-5 h-5 object-contain rounded-full" />
                ) : (
                  <div className="w-5 h-5 bg-emerald-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {src.name?.[0]}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-800">{src.name}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-semibold">
                  موثوقية {src.trust_score || 90}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Layout with Tabs */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'overview' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            نظرة عامة والملخص
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            الخط الزمني (Timeline)
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'articles' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            جميع التغطيات ({story.articles?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'sources' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            المصادر المعتمدة
          </button>
        </div>

        {/* Tab 1: Overview & Latest Coverage */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Latest Update Featured Card */}
            {story.articles?.[0] && (
              <Card className="p-6 bg-white border-2 border-emerald-500/30 rounded-2xl shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-100 text-emerald-800 font-bold">
                    آخر تحديث تغطية
                  </Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(story.articles[0].published_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 leading-snug">
                  {story.articles[0].title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {story.articles[0].summary}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border">
                      {story.articles[0].source_name?.[0] || 'م'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{story.articles[0].source_name || 'مصدر رسمي'}</div>
                      <div className="text-xs text-slate-500">مؤشر المصدر: {story.articles[0].source_trust || 95}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {story.articles[0].original_article_url && (
                      <a 
                        href={story.articles[0].original_article_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-slate-600 hover:text-emerald-700 flex items-center gap-1 font-semibold px-3 py-2 bg-slate-100 rounded-xl"
                      >
                        الرابط الأصلي <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Button 
                      onClick={() => onOpenArticleBySlug(story.articles[0].slug)}
                      variant="primary"
                      className="text-sm px-4 py-2"
                    >
                      قراءة التغطية الكاملة
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* All Articles Coverage List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">تغطيات وسائل الإعلام ({story.articles?.length || 0})</h3>
              <div className="grid gap-4">
                {story.articles?.map((article: any) => (
                  <Card key={article.id} className="p-5 bg-white border border-slate-200 hover:border-emerald-300 transition-all rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                          {article.source_name || 'مصدر إخباري'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(article.published_at).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer" onClick={() => onOpenArticleBySlug(article.slug)}>
                        {article.title}
                      </h4>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {article.summary}
                      </p>
                    </div>
                    <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto justify-between">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        موثوقية {article.source_trust || 90}%
                      </span>
                      <Button 
                        onClick={() => onOpenArticleBySlug(article.slug)}
                        variant="outline"
                        className="text-xs"
                      >
                        قراءة التغطية
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Timeline */}
        {activeTab === 'timeline' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-xl font-bold text-slate-900">الخط الزمني للحدث (Chronological Timeline)</h3>
            <div className="relative border-r-2 border-emerald-500/40 mr-4 pr-6 space-y-8">
              {timeline.map((item, idx) => (
                <div key={item.id || idx} className="relative space-y-2">
                  <div className="absolute -right-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow-xs"></div>
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 inline-block px-2.5 py-1 rounded-md">
                    {new Date(item.published_at).toLocaleString('ar-SA')}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.summary}</p>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-1">
                    <span>المصدر: {item.source_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Articles List */}
        {activeTab === 'articles' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">جميع المقالات والمصادر المرتبطة بهذا الحدث</h3>
            <div className="grid gap-4">
              {story.articles?.map((article: any) => (
                <Card key={article.id} className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {article.source_name}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(article.published_at).toLocaleString('ar-SA')}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{article.title}</h4>
                  <p className="text-sm text-slate-600">{article.summary}</p>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button onClick={() => onOpenArticleBySlug(article.slug)} variant="primary" className="text-xs">
                      قراءة المقال كاملًا
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Sources */}
        {activeTab === 'sources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {story.sources?.map((src: any) => (
              <Card key={src.id} className="p-5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {src.logo ? (
                    <img src={src.logo} alt={src.name} className="w-12 h-12 object-contain rounded-full border p-1" />
                  ) : (
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {src.name[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{src.name}</h4>
                    <p className="text-xs text-slate-500">مؤشر الجودة والموثوقية: {src.trust_score || 90}%</p>
                  </div>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 font-bold">مصدر معتمد</Badge>
              </Card>
            ))}
          </div>
        )}

        {/* Related Stories Section */}
        {relatedStories.length > 0 && (
          <section className="pt-8 border-t border-slate-200 space-y-6">
            <h3 className="text-2xl font-extrabold text-slate-900">قصص ذات صلة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedStories.map((rel) => (
                <Card 
                  key={rel.id} 
                  onClick={() => window.location.href = `/story/${rel.slug}`}
                  className="p-5 bg-white border border-slate-200 hover:border-emerald-400 transition-all rounded-2xl cursor-pointer space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{rel.category}</span>
                    <span>{rel.sources_count || 1} مصادر</span>
                  </div>
                  <h4 className="font-bold text-slate-900 line-clamp-2 hover:text-emerald-700 transition-colors">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {rel.summary}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
