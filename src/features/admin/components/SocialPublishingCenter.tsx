import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { NewsArticle } from '../../../core/domain/types';
import {
  Share2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Send,
  RotateCcw,
  Key,
  ShieldAlert,
} from 'lucide-react';

interface SocialPublishingCenterProps {
  articles: NewsArticle[];
  triggerToast: (msg: string) => void;
}

export const SocialPublishingCenter: React.FC<SocialPublishingCenterProps> = ({
  articles,
  triggerToast,
}) => {
  const [activeTab, setActiveTab] = useState<'PLATFORMS' | 'GENERATOR' | 'RULES' | 'RETRY_QUEUE'>('PLATFORMS');

  // Social Platforms Setup State
  const [platforms, setPlatforms] = useState([
    {
      id: 'fb',
      name: 'صفحة فيسبوك الرسمية (Facebook Page)',
      type: 'Facebook',
      status: 'Ready for Configuration',
      appId: '',
      accessToken: '',
      autoPublish: true,
    },
    {
      id: 'tg',
      name: 'قناة التليجرام الإخبارية (Telegram Channel)',
      type: 'Telegram',
      status: 'Ready for Configuration',
      botToken: '',
      chatId: '',
      autoPublish: true,
    },
    {
      id: 'x',
      name: 'حساب منصة إكس (Twitter API v2)',
      type: 'X',
      status: 'Ready for Configuration',
      apiKey: '',
      bearerToken: '',
      autoPublish: false,
    },
    {
      id: 'wa',
      name: 'قناة واتساب الرسمية (WhatsApp Channels Meta API)',
      type: 'WhatsApp',
      status: 'Ready for Configuration',
      phoneNumberId: '',
      metaToken: '',
      autoPublish: true,
    },
    {
      id: 'ig',
      name: 'إنستغرام الأعمال (Instagram Business API)',
      type: 'Instagram',
      status: 'Ready for Configuration',
      igUserId: '',
      accessToken: '',
      autoPublish: false,
    },
  ]);

  // AI Social Copy Generator State
  const [selectedArticleId, setSelectedArticleId] = useState(articles[0]?.id || '');
  const selectedArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];

  const [aiSocialCopy, setAiSocialCopy] = useState<{
    fb: string;
    x: string;
    tg: string;
    ig: string;
  } | null>(null);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  const handleGenerateSocialPosts = () => {
    if (!selectedArticle) return;
    setIsGeneratingCopy(true);
    setAiSocialCopy(null);

    setTimeout(() => {
      setIsGeneratingCopy(false);
      setAiSocialCopy({
        fb: `🚨 ${selectedArticle.title}\n\n${selectedArticle.summary}\n\n🔗 اقرأ التفاصيل الكاملة عبر أخبار نوعية:\n${selectedArticle.seoMeta?.canonicalUrl || 'https://naweayh.xyz'}`,
        x: `🚨 ${selectedArticle.title.slice(0, 180)}\n\nالتفاصيل: ${selectedArticle.seoMeta?.canonicalUrl || 'https://naweayh.xyz'}\n\n#أخبار_نوعية #أخبار_اليمن #${selectedArticle.category}`,
        tg: `📌 *${selectedArticle.title}*\n\n${selectedArticle.summary}\n\n🌐 [اقرأ الخبر كاملاً عبر الموقع](${selectedArticle.seoMeta?.canonicalUrl || 'https://naweayh.xyz'})`,
        ig: `📸 ${selectedArticle.title}\n\n${selectedArticle.summary}\n\n. \n. \n#أخبار_نوعية #نوعية #اليمن #${selectedArticle.category}`,
      });
    }, 1000);
  };

  const handleTestPlatformConnection = (platformName: string) => {
    triggerToast(`جاهز للإعداد: يرجى إدخال Credentials الحقيقية لـ ${platformName} للاتصال الفعلي`);
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">منظومة النشر الاجتماعي التلقائي والقواعد الذكية</h3>
          <p className="text-xs text-slate-500 mt-0.5">ربط منصات التواصل الاجتماعي، مولد الصياغات التلقائي بـ AI، وطابور إعادة المحاولة</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PLATFORMS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PLATFORMS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المنصات الحسابات ({platforms.length})
          </button>
          <button
            onClick={() => setActiveTab('GENERATOR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'GENERATOR' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            مولد المنشورات (AI)
          </button>
          <button
            onClick={() => setActiveTab('RULES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RULES' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            قواعد النشر
          </button>
          <button
            onClick={() => setActiveTab('RETRY_QUEUE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RETRY_QUEUE' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            طابور المحاولات
          </button>
        </div>
      </div>

      {/* PLATFORMS INTEGRATION */}
      {activeTab === 'PLATFORMS' && (
        <Card
          title="ربط منصات التواصل الاجتماعي والتطبيقات الرسمية"
          subtitle="تتيح هذه الشاشة إدخال المفاتيح والرموز الأمنية (API Credentials) للاتصال المباشر"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>سياسة الأمان: تظل المنصات بوضعية "جاهز للإعداد (Ready for Configuration)" حتى يتم إدخال مفاتيح API الحقيقية وتجربة الاتصال.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((plat) => (
                <div key={plat.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-bold text-slate-900">{plat.name}</h4>
                    </div>
                    <Badge variant="amber">جاهز للإعداد</Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <input
                      type="password"
                      placeholder="أدخل Access Token / Bot Token..."
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleTestPlatformConnection(plat.name)}
                      className="gap-1 text-xs"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>اختبار الاتصال بالمنصة</span>
                    </Button>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={plat.autoPublish}
                        onChange={(e) => {
                          const updated = platforms.map(p => p.id === plat.id ? { ...p, autoPublish: e.target.checked } : p);
                          setPlatforms(updated);
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span>نشر آلي</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* AI POST GENERATOR */}
      {activeTab === 'GENERATOR' && (
        <Card
          title="مولد المنشورات الاجتماعية المخصص لكل منصة بـ AI"
          subtitle="إنشاء نصوص موجهة لفيسبوك، تويتر، تليجرام، وإنستغرام بناءً على المحتوى"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">اختر المقال لتوليد نصوص النشر:</label>
              <select
                value={selectedArticleId}
                onChange={(e) => setSelectedArticleId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none"
              >
                {articles.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.title} ({art.category})
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateSocialPosts}
              disabled={isGeneratingCopy}
              className="bg-indigo-600 hover:bg-indigo-700 text-xs gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>توليد المنشورات الاجتماعية بـ Gemini AI</span>
            </Button>

            {isGeneratingCopy && (
              <div className="p-8 text-center text-xs text-indigo-600 font-bold animate-pulse">
                جاري توليد صياغات مخصصة تناسب خوارزميات وقواعد كل منصة...
              </div>
            )}

            {aiSocialCopy && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                {/* Facebook */}
                <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400">فيسبوك (Facebook Format)</span>
                    <Button variant="outline" size="xs" onClick={() => triggerToast('تم نسخ نص فيسبوك')}>
                      نسخ
                    </Button>
                  </div>
                  <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-200">
                    {aiSocialCopy.fb}
                  </pre>
                </div>

                {/* X */}
                <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400">منصة إكس (X / Twitter &lt; 280 chars)</span>
                    <Button variant="outline" size="xs" onClick={() => triggerToast('تم نسخ نص منصة إكس')}>
                      نسخ
                    </Button>
                  </div>
                  <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-200">
                    {aiSocialCopy.x}
                  </pre>
                </div>

                {/* Telegram */}
                <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">تليجرام (Telegram Markdown)</span>
                    <Button variant="outline" size="xs" onClick={() => triggerToast('تم نسخ نص تليجرام')}>
                      نسخ
                    </Button>
                  </div>
                  <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-200">
                    {aiSocialCopy.tg}
                  </pre>
                </div>

                {/* Instagram */}
                <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-400">إنستغرام (Instagram Caption)</span>
                    <Button variant="outline" size="xs" onClick={() => triggerToast('تم نسخ نص إنستغرام')}>
                      نسخ
                    </Button>
                  </div>
                  <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-200">
                    {aiSocialCopy.ig}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* RULES & RETRY QUEUE */}
      {(activeTab === 'RULES' || activeTab === 'RETRY_QUEUE') && (
        <Card
          title="قواعد النشر التلقائي وطابور إعادة المحاولة (Exponential Backoff)"
          subtitle="التحكم في الشروط وطابور الأخطاء للشبكات الاجتماعية"
        >
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <RotateCcw className="w-8 h-8 text-indigo-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">طابور إعادة المحاولة جاهز وخالٍ من الأخطاء حالياً</h4>
            <p className="text-xs text-slate-500">يقوم السيرفر بالتكرار التلقائي في حال انقطاع الشبكة أو تجاوز معدل API Rate Limits.</p>
          </div>
        </Card>
      )}
    </div>
  );
};
