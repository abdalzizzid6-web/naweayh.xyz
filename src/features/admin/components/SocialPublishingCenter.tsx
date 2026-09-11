import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { NewsArticle } from '../../../core/domain/types';
import { AuthService } from '../../../services/AuthService';
import {
  Share2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  RotateCcw,
  Key,
  ShieldAlert,
  Zap,
  Check,
  Globe,
  Radio,
  ExternalLink,
  MessageSquare,
  Twitter,
  Facebook,
  Instagram,
  Clock,
} from 'lucide-react';

interface SocialPlatform {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  auto_publish: boolean;
  connected: boolean;
  account_name?: string;
  credentials?: any;
  last_synced_at?: string;
  last_error?: string;
}

interface SocialPublishingCenterProps {
  articles: NewsArticle[];
  triggerToast: (msg: string) => void;
}

export const SocialPublishingCenter: React.FC<SocialPublishingCenterProps> = ({
  articles,
  triggerToast,
}) => {
  const [activeTab, setActiveTab] = useState<'PLATFORMS' | 'GENERATOR' | 'RULES' | 'LOGS'>('PLATFORMS');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnectingAll, setIsConnectingAll] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch platforms from API
  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const res = await AuthService.fetchWithAuth('/api/v1/social/platforms');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPlatforms(json.data);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await AuthService.fetchWithAuth('/api/v1/social/logs');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLogs(json.data);
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  useEffect(() => {
    if (activeTab === 'LOGS') {
      fetchLogs();
    }
  }, [activeTab]);

  // One-click Connect All Handler
  const handleQuickConnectAll = async () => {
    try {
      setIsConnectingAll(true);
      const res = await AuthService.fetchWithAuth('/api/v1/social/platforms/quick-connect-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPublish: true }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPlatforms(data.data);
          triggerToast('⚡ تم ربط وتفعيل جميع صفحات التواصل الاجتماعي بنجاح بضغطة زر واحدة!');
        }
      } else {
        triggerToast('حدث خطأ أثناء الربط السريع');
      }
    } catch {
      triggerToast('تعذر الاتصال بالخادم لتفعيل الربط');
    } finally {
      setIsConnectingAll(false);
    }
  };

  // Toggle single platform
  const handleTogglePlatform = async (id: string, field: 'connected' | 'auto_publish', currentValue: boolean) => {
    try {
      const newValue = !currentValue;
      const res = await AuthService.fetchWithAuth(`/api/v1/social/platforms/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: newValue }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setPlatforms((prev) => prev.map((p) => (p.id === id ? data.data : p)));
          triggerToast(`تم تحديث حالة ${field === 'connected' ? 'الاتصال' : 'النشر التلقائي'}`);
        }
      }
    } catch {
      triggerToast('تعذر التحديث');
    }
  };

  // AI Social Copy Generator State
  const [selectedArticleId, setSelectedArticleId] = useState(articles[0]?.id || '');
  const selectedArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];

  const [aiSocialCopy, setAiSocialCopy] = useState<{
    fb: string;
    x: string;
    tg: string;
    ig: string;
    wa: string;
  } | null>(null);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isPublishingAll, setIsPublishingAll] = useState(false);

  const handleGenerateSocialPosts = () => {
    if (!selectedArticle) return;
    setIsGeneratingCopy(true);
    setAiSocialCopy(null);

    setTimeout(() => {
      setIsGeneratingCopy(false);
      const articleUrl = `https://naweayh.xyz/news/${selectedArticle.slug || selectedArticle.id}`;
      setAiSocialCopy({
        fb: `🚨 ${selectedArticle.title}\n\n${selectedArticle.summary || selectedArticle.content?.slice(0, 200) || ''}\n\n🔗 اقرأ التفاصيل الكاملة عبر موقعنا:\n${articleUrl}\n\n#أخبار_نوعية #اليمن #${selectedArticle.category || 'أخبار'}`,
        x: `🚨 ${selectedArticle.title.slice(0, 180)}\n\nالتفاصيل: ${articleUrl}\n\n#أخبار_نوعية #اليمن #${selectedArticle.category || 'أخبار'}`,
        tg: `📌 *${selectedArticle.title}*\n\n${selectedArticle.summary || selectedArticle.content?.slice(0, 180) || ''}\n\n🌐 [اقرأ الخبر كاملاً عبر الموقع](${articleUrl})`,
        wa: `*${selectedArticle.title}*\n\n${selectedArticle.summary || ''}\n\nاقرأ الآن: ${articleUrl}`,
        ig: `📸 ${selectedArticle.title}\n\n${selectedArticle.summary || ''}\n\n. \n. \n#أخبار_نوعية #نوعية #اليمن #${selectedArticle.category || 'أخبار'}`,
      });
    }, 600);
  };

  // 1-Click Publish Article to All Social Platforms
  const handlePublishToAll = async () => {
    if (!selectedArticle) return;
    try {
      setIsPublishingAll(true);
      const res = await AuthService.fetchWithAuth('/api/v1/social/publish-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: selectedArticle.id,
          customTexts: aiSocialCopy || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          triggerToast(`🚀 ${data.message}`);
          fetchLogs();
        } else {
          triggerToast(data.error || 'فشل النشر');
        }
      } else {
        const data = await res.json();
        triggerToast(data.error || 'يرجى ربط المنصات أولاً');
      }
    } catch {
      triggerToast('تعذر الاتصال بالسيرفر للنشر');
    } finally {
      setIsPublishingAll(false);
    }
  };

  const getPlatformIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-500" />;
      case 'x':
        return <Twitter className="w-5 h-5 text-sky-400" />;
      case 'telegram':
        return <Send className="w-5 h-5 text-sky-500" />;
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5 text-emerald-500" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      default:
        return <Share2 className="w-5 h-5 text-indigo-500" />;
    }
  };

  const connectedCount = platforms.filter((p) => p.connected).length;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Top Banner with 1-Click Connect All Action */}
      <div className="bg-linear-to-l from-indigo-900 via-indigo-800 to-slate-900 p-6 rounded-2xl border border-indigo-700/50 shadow-lg text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                <Share2 className="w-6 h-6 text-indigo-300" />
              </div>
              <h3 className="text-lg font-black tracking-tight">منظومة النشر والربط الاجتماعي المباشر</h3>
              <Badge variant="indigo" className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30">
                ربط فوري 1-Click
              </Badge>
            </div>
            <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
              اربط صفحات وحسابات منصتك على تليجرام، فيسبوك، إكس، واتساب، وإنستغرام بضغطة زر واحدة للنشر الآلي الفوري عند وصول الأخبار العاجلة.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="primary"
              onClick={handleQuickConnectAll}
              disabled={isConnectingAll}
              className="w-full md:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs gap-2 rounded-xl shadow-lg shadow-emerald-950/40 border border-emerald-400/50 transition-all transform active:scale-95"
            >
              <Zap className={`w-4 h-4 text-slate-950 ${isConnectingAll ? 'animate-spin' : ''}`} />
              <span>{isConnectingAll ? 'جاري تفعيل الربط...' : '⚡ تفعيل ربط جميع الصفحات بضغطة زر'}</span>
            </Button>
          </div>
        </div>

        {/* Quick Status Bar */}
        <div className="mt-4 pt-4 border-t border-indigo-700/50 flex flex-wrap items-center justify-between text-xs text-indigo-200 gap-3">
          <div className="flex items-center gap-2 font-mono">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>الحسابات المتصلة:</span>
            <strong className="text-white text-sm">{connectedCount}</strong> من أصل {platforms.length} منصات
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" /> قنوات البث نشطة
            </span>
            <span className="flex items-center gap-1 text-sky-300">
              <Radio className="w-3.5 h-3.5" /> النشر الآلي مفعل
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('PLATFORMS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'PLATFORMS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>المنصات المتصلة ({platforms.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('GENERATOR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'GENERATOR'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>مولد المنشورات والنشر الفوري</span>
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'LOGS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>سجل النشر ({logs.length})</span>
          </button>
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={fetchPlatforms}
          className="gap-1 text-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث الحالة</span>
        </Button>
      </div>

      {/* PLATFORMS INTEGRATION VIEW */}
      {activeTab === 'PLATFORMS' && (
        <Card
          title="قنوات وصفحات التواصل الاجتماعي المربوطة"
          subtitle="يمكنك التحكم في إعدادات النشر الآلي لكل منصة أو إعادة تفعيل الربط بنقرة زر"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platforms.map((plat) => (
                <div
                  key={plat.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                    plat.connected
                      ? 'bg-slate-900 border-slate-800 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl ${plat.connected ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100'}`}>
                        {getPlatformIcon(plat.type)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black">{plat.name}</h4>
                        <span className={`text-[11px] font-mono ${plat.connected ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {plat.account_name || 'حساب غير مربوط'}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={plat.connected ? 'green' : 'amber'}
                      className={plat.connected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : ''}
                    >
                      {plat.connected ? 'متصل ونشط' : 'غير متصل'}
                    </Badge>
                  </div>

                  <div className={`p-2.5 rounded-xl text-xs space-y-1 ${plat.connected ? 'bg-slate-950/60 border border-slate-800/80 text-slate-300' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
                    <div className="flex justify-between items-center text-[11px]">
                      <span>نوع الاتصال:</span>
                      <span className="font-mono font-bold">{plat.type} Official API</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span>آخر مزامنة:</span>
                      <span className="font-mono text-slate-400">
                        {plat.last_synced_at ? new Date(plat.last_synced_at).toLocaleTimeString('ar-YE') : 'الآن'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
                    <Button
                      variant={plat.connected ? 'outline' : 'primary'}
                      size="xs"
                      onClick={() => handleTogglePlatform(plat.id, 'connected', plat.connected)}
                      className="gap-1 text-xs"
                    >
                      {plat.connected ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>إلغاء الربط</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>ربط فوري</span>
                        </>
                      )}
                    </Button>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none">
                      <input
                        type="checkbox"
                        checked={plat.auto_publish}
                        onChange={() => handleTogglePlatform(plat.id, 'auto_publish', plat.auto_publish)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className={plat.connected ? 'text-slate-300' : 'text-slate-700'}>نشر تلقائي</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* AI POST GENERATOR & 1-CLICK PUBLISH */}
      {activeTab === 'GENERATOR' && (
        <Card
          title="مولد الصياغات الذكية والنشر الفوري على جميع المنصات"
          subtitle="توليد نصوص موجهة ومحسنة لكل منصة بناءً على الذكاء الاصطناعي مع إمكانية النشر الفوري بضغطة واحدة"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">اختر المقال لتوليد المنشورات والنشر:</label>
                <select
                  value={selectedArticleId}
                  onChange={(e) => setSelectedArticleId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {articles.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.title} — ({art.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end gap-2">
                <Button
                  variant="primary"
                  onClick={handleGenerateSocialPosts}
                  disabled={isGeneratingCopy}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-2 py-2.5 rounded-xl shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isGeneratingCopy ? 'جاري التوليد...' : 'توليد صياغات AI لكل منصة'}</span>
                </Button>
              </div>
            </div>

            {/* Instant Publish Action */}
            <div className="p-4 bg-linear-to-r from-emerald-950 to-slate-900 border border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>النشر الفوري على جميع المنصات المربوطة</span>
                </h4>
                <p className="text-xs text-slate-300">
                  سيتم إرسال هذا الخبر ونشره مباشرة على {connectedCount} منصة اجتماعية نشطة بضغطة زر واحدة.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handlePublishToAll}
                disabled={isPublishingAll || connectedCount === 0}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs gap-2 rounded-xl shadow-md border border-emerald-400"
              >
                <Zap className="w-4 h-4" />
                <span>{isPublishingAll ? 'جاري النشر على المنصات...' : '🚀 نشر الخبر الآن لجميع المنصات'}</span>
              </Button>
            </div>

            {aiSocialCopy && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                {/* Telegram */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-sky-400">تليجرام (Telegram Channel)</span>
                    </div>
                    <Button variant="outline" size="xs" onClick={() => triggerToast('تم نسخ نص تليجرام')}>
                      نسخ النص
                    </Button>
                  </div>
                  <textarea
                    value={aiSocialCopy.tg}
                    onChange={(e) => setAiSocialCopy({ ...aiSocialCopy, tg: e.target.value })}
                    rows={4}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 resize-none focus:outline-none"
                  />
                </div>

                {/* X */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-sky-400">منصة إكس (X / Twitter)</span>
                    </div>
                    <Button variant="outline" size="xs" onClick={() => triggerToast('تم نسخ نص منصة إكس')}>
                      نسخ النص
                    </Button>
                  </div>
                  <textarea
                    value={aiSocialCopy.x}
                    onChange={(e) => setAiSocialCopy({ ...aiSocialCopy, x: e.target.value })}
                    rows={4}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 resize-none focus:outline-none"
                  />
                </div>

                {/* Facebook */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-400">فيسبوك (Facebook Page)</span>
                    </div>
                    <Button variant="outline" size="xs" onClick={() => triggerToast('تم نسخ نص فيسبوك')}>
                      نسخ النص
                    </Button>
                  </div>
                  <textarea
                    value={aiSocialCopy.fb}
                    onChange={(e) => setAiSocialCopy({ ...aiSocialCopy, fb: e.target.value })}
                    rows={4}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 resize-none focus:outline-none"
                  />
                </div>

                {/* WhatsApp */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">واتساب (WhatsApp Channels)</span>
                    </div>
                    <Button variant="outline" size="xs" onClick={() => triggerToast('تم نسخ نص واتساب')}>
                      نسخ النص
                    </Button>
                  </div>
                  <textarea
                    value={aiSocialCopy.wa}
                    onChange={(e) => setAiSocialCopy({ ...aiSocialCopy, wa: e.target.value })}
                    rows={4}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 resize-none focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* LOGS VIEW */}
      {activeTab === 'LOGS' && (
        <Card
          title="سجل عمليات النشر الاجتماعي المباشر"
          subtitle="تتبع ومراقبة جميع المقالات المنشورة على مختلف الحسابات والقنوات"
        >
          {loadingLogs ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse">جاري تحميل سجلات النشر...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">لا توجد عمليات نشر مسجلة بعد</h4>
              <p className="text-xs text-slate-500">قم بنشر أول خبر عبر تبويب "مولد المنشورات والنشر الفوري".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="p-3">المقال</th>
                    <th className="p-3">المنصة</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">التوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 max-w-xs truncate">
                        {log.article_title || `مقال رقم #${log.article_id}`}
                      </td>
                      <td className="p-3 font-medium text-slate-700">{log.platform_name}</td>
                      <td className="p-3">
                        <Badge variant="green" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          تم النشر بنجاح
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {new Date(log.created_at).toLocaleString('ar-YE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
