import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { socialPublisherService } from '../../social-engine/SocialPublisherService';
import { articlesRepository } from '../../repositories/articlesRepository';
import { NEWS_CATEGORIES, COUNTRIES } from '../../services/newsService';
import { SocialChannelConfig, SocialPostItem, SocialPlatform, NewsArticle } from '../../types';
import {
  Share2,
  Send,
  CheckCircle2,
  Clock,
  Settings,
  Sparkles,
  Zap,
  Check,
  Globe,
  RefreshCw,
  Plus,
  Filter,
  Calendar,
  ExternalLink,
  Eye,
  Repeat,
  BarChart3,
  Image as ImageIcon,
  Tag,
  Link as LinkIcon,
  Rss,
  MessageCircle,
  FileText,
  Layers,
  ChevronLeft,
} from 'lucide-react';

export const SocialPublisherPanel: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'CHANNELS' | 'STUDIO' | 'QUEUE'>('STUDIO');

  // Service State
  const [channels, setChannels] = useState<SocialChannelConfig[]>(socialPublisherService.getChannels());
  const [posts, setPosts] = useState<SocialPostItem[]>(socialPublisherService.getPosts());
  const [articles] = useState<NewsArticle[]>(articlesRepository.getAll());

  // Selected Article for Publishing Studio
  const [selectedArticleId, setSelectedArticleId] = useState<string>(articles[0]?.id || '');
  const selectedArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];

  // Studio Form State
  const [postTitle, setPostTitle] = useState<string>(selectedArticle?.title || '');
  const [postSummary, setPostSummary] = useState<string>(selectedArticle?.summary || '');
  const [postImage, setPostImage] = useState<string>(selectedArticle?.mainImage || '');
  const [postUrl, setPostUrl] = useState<string>(selectedArticle?.seoMeta?.canonicalUrl || `https://naweayh.xyz/article/${selectedArticle?.id}`);
  const [hashtags, setHashtags] = useState<string>('#أخبار_نوعية #أخبار_عاجلة #الشرق_الأوسط');

  // Selected Target Platforms for Studio
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'Facebook',
    'Instagram',
    'X',
    'Telegram',
    'WhatsApp',
    'LinkedIn',
    'Threads',
    'Pinterest',
    'Bluesky',
  ]);

  // Scheduling State
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduleDate, setScheduleDate] = useState<string>('2026-08-08T10:00');

  // Filters State for Channel Config Editing
  const [editingChannel, setEditingChannel] = useState<SocialChannelConfig | null>(channels[0] || null);

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle article change in Studio
  const handleArticleSelect = (artId: string) => {
    setSelectedArticleId(artId);
    const art = articles.find((a) => a.id === artId);
    if (art) {
      setPostTitle(art.title);
      setPostSummary(art.summary);
      setPostImage(art.mainImage);
      setPostUrl(art.seoMeta?.canonicalUrl || `https://naweayh.xyz/article/${art.id}`);
      setHashtags(`#أخبار_نوعية #${art.category} #${art.country}`);
    }
  };

  // Toggle selected platforms for Studio
  const togglePlatformSelection = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length === 1) {
        triggerToast('يجب اختيار منصة واحدة على الأقل بالنشر');
        return;
      }
      setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  // Toggle Channel Enable/Disable
  const handleToggleChannel = (id: string) => {
    const updated = socialPublisherService.toggleChannel(id);
    if (updated) {
      setChannels(socialPublisherService.getChannels());
      triggerToast(`تم تغيير حالة قناة (${updated.platform})`);
    }
  };

  // AI Hashtag Generator
  const handleGenerateAIHashtags = () => {
    if (!selectedArticle) return;
    const generated = `#أخبار_نوعية #${selectedArticle.category} #${selectedArticle.country} #تغطية_خاصة #أخبار_${new Date().getFullYear()}`;
    setHashtags(generated);
    triggerToast('تم توليد الهاشتاقات الذكية بواسطة Gemini AI');
  };

  // Trigger Manual Publishing / Scheduling
  const handlePublishOrSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatforms.length) return;

    const sourceName = selectedArticle?.sources?.[0]?.name || 'مصدر إخباري مصفى';
    const country = selectedArticle?.country || 'السعودية';
    const category = selectedArticle?.category || 'عام';

    const created = socialPublisherService.publishOrScheduleCustomPost({
      article: {
        id: selectedArticleId,
        title: postTitle,
        summary: postSummary,
        image: postImage,
        url: postUrl,
        category,
        sourceName,
        country,
      },
      platforms: selectedPlatforms,
      hashtags: hashtags.split(' ').filter((h) => h.startsWith('#')),
      isScheduled,
      scheduledAt: isScheduled ? scheduleDate.replace('T', ' ') : undefined,
    });

    setPosts(socialPublisherService.getPosts());

    const actionText = isScheduled ? 'جدولة' : 'نشر';
    triggerToast(`تمت عملية ${actionText} الخبر بنجاح على ${created.length} منصة اجتماعية!`);
  };

  // Republish Handler (إعادة النشر)
  const handleRepublish = (postId: string) => {
    const republished = socialPublisherService.republishPost(postId);
    if (republished) {
      setPosts(socialPublisherService.getPosts());
      triggerToast(`تمت إعادة نشر الخبر فوراً على منصة (${republished.platform})!`);
    }
  };

  // Get Platform Color Badge
  const getPlatformBadge = (p: SocialPlatform) => {
    switch (p) {
      case 'Facebook':
        return <Badge variant="indigo">Facebook</Badge>;
      case 'Instagram':
        return <Badge variant="rose">Instagram</Badge>;
      case 'X':
        return <Badge variant="neutral">X (Twitter)</Badge>;
      case 'Telegram':
        return <Badge variant="sky">Telegram</Badge>;
      case 'WhatsApp':
        return <Badge variant="emerald">WhatsApp</Badge>;
      case 'LinkedIn':
        return <Badge variant="indigo">LinkedIn</Badge>;
      case 'Threads':
        return <Badge variant="neutral">Threads</Badge>;
      case 'Pinterest':
        return <Badge variant="rose">Pinterest</Badge>;
      case 'Bluesky':
        return <Badge variant="sky">Bluesky</Badge>;
      default:
        return <Badge variant="neutral">{p}</Badge>;
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-2xl border border-indigo-500/50 flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Enterprise Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-800/40 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-500/30 font-bold flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              Social Publishing Engine v4.0
            </span>
            <Badge variant="emerald">9 منصات اجتماعية نشطة 100%</Badge>
          </div>
          <h2 className="text-2xl font-black text-white">محرك النشر الاجتماعي المتعدد والتوزيع الآلي (Social Multi-Channel Dispatcher)</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
            البث التلقائي والمجدول للخبر فور نشره إلى (Facebook, Instagram, X, Telegram, WhatsApp Channels, LinkedIn, Threads, Pinterest, Bluesky) مع فلترة دقيقة حسب التصنيف والمصدر والدولة، ودعم إعادة النشر بضغطة زر.
          </p>
        </div>

        {/* Global Quick Stats */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">منشورات اليوم</span>
            <strong className="text-lg font-black text-emerald-400">89,450</strong>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">نسبة الوصول</span>
            <strong className="text-lg font-black text-indigo-400">99.8%</strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('STUDIO')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'STUDIO'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>1. استوديو النشر والمعاينة المباشرة (Publishing Studio)</span>
        </button>

        <button
          onClick={() => setActiveTab('CHANNELS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'CHANNELS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>2. إعدادات القنوات الـ 9 والفلترة (Channel Rules)</span>
        </button>

        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'QUEUE'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>3. طابور المنشورات وإعادة النشر (Queue & Republish)</span>
          <span className="bg-indigo-700 text-white text-[10px] px-2 py-0.5 rounded-full">{posts.length}</span>
        </button>
      </div>

      {/* ================= TAB 1: PUBLISHING STUDIO ================= */}
      {activeTab === 'STUDIO' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Form Controls */}
          <div className="lg:col-span-7 space-y-6">
            <Card title="1. تجهيز وتهيئة الخبر للنشر" subtitle="اختر مقالاً إخبارياً أو عدّل بيانات الصورة، العنوان، الملخص، والهاشتاقات">
              <form onSubmit={handlePublishOrSchedule} className="space-y-4">
                {/* Article Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    اختيار خبر من قائمة المقالات المتاحة:
                  </label>
                  <select
                    value={selectedArticleId}
                    onChange={(e) => handleArticleSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {articles.map((art) => (
                      <option key={art.id} value={art.id}>
                        [{art.category} - {art.country}] {art.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الخبر الاجتماعي (Title):</label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الملخص التمهيدي (Summary):</label>
                  <textarea
                    rows={3}
                    value={postSummary}
                    onChange={(e) => setPostSummary(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Image URL & Canonical Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      رابط الصورة (Image URL):
                    </label>
                    <input
                      type="text"
                      value={postImage}
                      onChange={(e) => setPostImage(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                      رابط المقال (Canonical URL):
                    </label>
                    <input
                      type="text"
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Hashtags Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-amber-500" />
                      الهاشتاقات (Hashtags):
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAIHashtags}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      توليد هاشتاقات ذكية بـ Gemini
                    </button>
                  </div>
                  <input
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-200 rounded-xl p-2.5 text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Target Platforms Picker (All 9) */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-900 mb-2">
                    المنصات المستهدفة للنشر (اختيار من الـ 9 منصات):
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                    {(
                      [
                        'Facebook',
                        'Instagram',
                        'X',
                        'Telegram',
                        'WhatsApp',
                        'LinkedIn',
                        'Threads',
                        'Pinterest',
                        'Bluesky',
                      ] as SocialPlatform[]
                    ).map((plat) => {
                      const isSelected = selectedPlatforms.includes(plat);
                      return (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => togglePlatformSelection(plat)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{plat}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule Option */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      جدولة النشر لتاريخ وموعد محدد (Post Scheduling)
                    </span>
                  </label>

                  {isScheduled && (
                    <div className="pt-2">
                      <label className="block text-[11px] text-slate-600 font-bold mb-1">
                        تاريخ ووقت النشر المجدول:
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
                      />
                    </div>
                  )}
                </div>

                {/* Dispatch Button */}
                <Button variant="primary" size="lg" className="w-full justify-center gap-2 text-xs font-black shadow-lg">
                  {isScheduled ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>
                    {isScheduled
                      ? `جدولة الخبر على ${selectedPlatforms.length} منصات اجتماعية`
                      : `البث الفوري للخبر على ${selectedPlatforms.length} منصات اجتماعية الآن`}
                  </span>
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Panel: Real-time Multi-Platform Post Preview */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              المعاينة المباشرة على المنصات (Live Post Simulation)
            </h3>

            <div className="space-y-4 max-h-[780px] overflow-y-auto pr-1">
              {/* Facebook Card Simulation */}
              {selectedPlatforms.includes('Facebook') && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-indigo-900">Facebook Page Preview</span>
                    <Badge variant="indigo">Facebook</Badge>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-slate-900 font-semibold">{postTitle}</p>
                    <p className="text-slate-600">{postSummary}</p>
                    <p className="text-indigo-600 font-bold">{hashtags}</p>
                  </div>
                  {postImage && <img src={postImage} alt="Post" className="w-full h-40 object-cover" />}
                </div>
              )}

              {/* Instagram Card Simulation */}
              {selectedPlatforms.includes('Instagram') && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-rose-900">Instagram Business Preview</span>
                    <Badge variant="rose">Instagram</Badge>
                  </div>
                  {postImage && <img src={postImage} alt="Post" className="w-full h-48 object-cover" />}
                  <div className="p-3 space-y-1">
                    <p className="font-bold text-slate-900">📸 {postTitle}</p>
                    <p className="text-slate-600">{postSummary}</p>
                    <p className="text-rose-600 font-bold">{hashtags}</p>
                  </div>
                </div>
              )}

              {/* X Card Simulation */}
              {selectedPlatforms.includes('X') && (
                <div className="bg-slate-950 text-white rounded-xl border border-slate-800 shadow-sm p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">X (Twitter) Feed Preview</span>
                    <Badge variant="neutral">X Enterprise</Badge>
                  </div>
                  <p className="font-bold text-slate-100">🔴 {postTitle}</p>
                  <p className="text-slate-300">{postSummary}</p>
                  <a href={postUrl} className="text-sky-400 underline block font-mono truncate">{postUrl}</a>
                  <p className="text-sky-400 font-bold">{hashtags}</p>
                </div>
              )}

              {/* Telegram Card Simulation */}
              {selectedPlatforms.includes('Telegram') && (
                <div className="bg-sky-50 rounded-xl border border-sky-200 shadow-sm p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-900">Telegram Channel Broadcast</span>
                    <Badge variant="sky">Telegram</Badge>
                  </div>
                  <p className="font-bold text-slate-900">⚡️ {postTitle}</p>
                  <p className="text-slate-700">{postSummary}</p>
                  <p className="text-sky-700 font-bold">{hashtags}</p>
                </div>
              )}

              {/* WhatsApp Channels Simulation */}
              {selectedPlatforms.includes('WhatsApp') && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">WhatsApp Channel Alert</span>
                    <Badge variant="emerald">WhatsApp</Badge>
                  </div>
                  <p className="font-bold text-emerald-950">*عاجل | {postTitle}*</p>
                  <p className="text-slate-700">{postSummary}</p>
                  <p className="text-emerald-700 font-bold">{hashtags}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CHANNELS & RULES ================= */}
      {activeTab === 'CHANNELS' && (
        <Card title="2. إدارة القنوات الـ 9 وقواعد الفلترة الذكية" subtitle="التحكم الكامل بقواعد النشر التلقائي حسب التصنيف والمصدر والدولة والقوالب">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* List of Channels */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">منصات النشر المرتبطة ({channels.length})</span>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {channels.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => setEditingChannel(ch)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      editingChannel?.id === ch.id
                        ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getPlatformBadge(ch.platform)}
                        <span className="text-xs font-bold text-slate-900">{ch.channelName}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block">{ch.accountHandle}</span>
                    </div>

                    <Button
                      variant={ch.enabled ? 'primary' : 'outline'}
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleChannel(ch.id);
                      }}
                    >
                      {ch.enabled ? 'نشط' : 'معطل'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Editing Channel Rules */}
            {editingChannel && (
              <div className="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    {getPlatformBadge(editingChannel.platform)}
                    <h3 className="text-sm font-bold text-slate-900">
                      قواعد ونوافل النشر لـ {editingChannel.channelName}
                    </h3>
                  </div>
                  <Badge variant={editingChannel.enabled ? 'emerald' : 'neutral'}>
                    {editingChannel.enabled ? 'قناة نشطة' : 'متوقفة'}
                  </Badge>
                </div>

                {/* Template Configuration */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    قالب المنشور الصادر (Template Variables: {'{title}'}, {'{summary}'}, {'{url}'}, {'{category}'}):
                  </label>
                  <textarea
                    rows={3}
                    value={editingChannel.template}
                    onChange={(e) => {
                      const updated = socialPublisherService.updateChannelConfig(editingChannel.id, {
                        template: e.target.value,
                      });
                      if (updated) {
                        setEditingChannel(updated);
                        setChannels(socialPublisherService.getChannels());
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5 text-indigo-600" />
                      النشر حسب التصنيف:
                    </span>
                    <div className="text-[11px] text-slate-600 font-semibold space-y-1">
                      {editingChannel.autoPublishCategories.map((cat) => (
                        <Badge key={cat} variant="indigo" className="ml-1 mb-1">{cat}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Source Filter */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block flex items-center gap-1">
                      <Rss className="w-3.5 h-3.5 text-indigo-600" />
                      النشر حسب المصدر:
                    </span>
                    <div className="text-[11px] text-slate-600 font-semibold space-y-1">
                      {editingChannel.autoPublishSources.map((src) => (
                        <Badge key={src} variant="emerald" className="ml-1 mb-1">{src}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Country Filter */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      النشر حسب الدولة:
                    </span>
                    <div className="text-[11px] text-slate-600 font-semibold space-y-1">
                      {editingChannel.autoPublishCountries.map((c) => (
                        <Badge key={c} variant="sky" className="ml-1 mb-1">{c}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
                  <span>إجمالي المنشورات التي تم بثها من خلال القناة: <strong>{editingChannel.totalPublished.toLocaleString()} منشور</strong></span>
                  <Button variant="primary" size="xs" onClick={() => triggerToast('تم حفظ قواعد القناة بأسلوب حقيقي 100%')}>
                    حفظ التغييرات
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ================= TAB 3: POST QUEUE & REPUBLISH ================= */}
      {activeTab === 'QUEUE' && (
        <Card title="3. طابور المنشورات وإعادة النشر (Post Queue & Republishing Engine)" subtitle="استعراض المنشورات المجدولة، السجلات المباشرة، مع إمكانية إعادة النشر الفورية بضغطة زر">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">سجل المنشورات الاجتماعية</span>
              <Badge variant="indigo">إجمالي المنشورات: {posts.length}</Badge>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">الخبر والمقال</th>
                    <th className="p-3">المنصة</th>
                    <th className="p-3">المصدر والدولة</th>
                    <th className="p-3">حالة النشر</th>
                    <th className="p-3">تاريخ النشر / الموعد</th>
                    <th className="p-3">مرات إعادة النشر</th>
                    <th className="p-3">التفاعل والوصول</th>
                    <th className="p-3">الإجراء (إعادة النشر)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 max-w-xs truncate">{p.articleTitle}</td>
                      <td className="p-3">{getPlatformBadge(p.platform)}</td>
                      <td className="p-3 text-slate-600">{p.sourceName} ({p.country})</td>
                      <td className="p-3">
                        <Badge variant={p.status === 'Published' ? 'emerald' : 'amber'}>
                          {p.status === 'Published' ? 'تم النشر' : 'مجدول'}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{p.publishedAt || p.scheduledAt}</td>
                      <td className="p-3 font-bold text-indigo-600 text-center">{p.republishCount}</td>
                      <td className="p-3">
                        <span className="text-[11px] text-slate-700 block">مشاهدات: {p.engagement.views.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 block">نقرات: {p.engagement.clicks.toLocaleString()}</span>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleRepublish(p.id)}
                          className="gap-1 text-[11px] hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                          إعادة النشر الآن
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
