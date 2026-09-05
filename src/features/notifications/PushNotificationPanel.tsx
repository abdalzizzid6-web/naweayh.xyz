import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { pushNotificationService } from '../../notifications/PushNotificationService';
import { articlesRepository } from '../../repositories/articlesRepository';
import { buildArticleCanonicalUrl } from '../../core/utils/urlUtils';
import { NEWS_CATEGORIES, COUNTRIES } from '../../services/newsService';
import {
  PushNotificationCampaign,
  NotificationProvider,
  NotificationTargetType,
  NotificationPriority,
  NotificationProviderConfig,
  NewsArticle,
} from '../../types';
import {
  Bell,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  Check,
  Target,
  Globe,
  Filter,
  Tag,
  Calendar,
  Sparkles,
  Smartphone,
  Flame,
  RefreshCw,
  Award,
  Activity,
  AlertCircle,
  Eye,
  Split,
  Radio,
  FileText,
  Sliders,
  CheckSquare,
  BarChart3,
  Link as LinkIcon,
  Image as ImageIcon,
  UserCheck,
} from 'lucide-react';

const INTERESTS_LIST = [
  'الذكاء الاصطناعي',
  'أسواق المال والبورصة',
  'الطاقة والتعدين',
  'كرة القدم والرياضة',
  'الهواتف والتقنية',
  'العقارات والاستثمار',
  'السيارات الكهربائية',
  'الصحة والعلوم',
];

const USER_SEGMENTS = [
  'VIP_Investors (كبار المستثمرين)',
  'Daily_Readers (القراء اليوميون)',
  'Breaking_News_Subscribers (مشتركو العاجل)',
  'Tech_Leaders (قادة التقنية)',
  'Sports_Fanatics (متابعو الرياضة المكثفة)',
];

export const PushNotificationPanel: React.FC = () => {
  // Navigation Sub-tabs inside Engine
  const [activeTab, setActiveTab] = useState<'DISPATCH' | 'AB_TESTING' | 'SCHEDULED' | 'PROVIDERS'>('DISPATCH');

  // Engine Data State
  const [campaigns, setCampaigns] = useState<PushNotificationCampaign[]>(pushNotificationService.getCampaigns());
  const [providerConfig, setProviderConfig] = useState<NotificationProviderConfig>(pushNotificationService.getProviderConfig());
  const [articles] = useState<NewsArticle[]>(articlesRepository.getAll());

  // Quick Article Auto-Fill
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');

  // Primary Dispatch Form State
  const [titleInput, setTitleInput] = useState<string>('🔴 عاجل | قمة الذكاء الاصطناعي تعلن استثمارات بـ 15 مليار دولار في الرياض');
  const [bodyInput, setBodyInput] = useState<string>('تغطية شاملة للإعلان عن ميثاق حوكمة الذكاء الاصطناعي وبناء مراكز بيانات عملاقة فائقة القدرة.');
  const [imageUrlInput, setImageUrlInput] = useState<string>('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800');
  const [articleUrlInput, setArticleUrlInput] = useState<string>(buildArticleCanonicalUrl('saudi-ai-initiative-2026'));

  // Provider Selection: Firebase FCM, OneSignal, Hybrid Dual
  const [selectedProvider, setSelectedProvider] = useState<NotificationProvider>('Hybrid_Dual');

  // Targeting Options
  const [targetType, setTargetType] = useState<NotificationTargetType>('BREAKING_SUBSCRIBERS');
  const [targetCategory, setTargetCategory] = useState<string>('تقنية');
  const [targetCountry, setTargetCountry] = useState<string>('السعودية');
  const [targetInterest, setTargetInterest] = useState<string>('الذكاء الاصطناعي');
  const [personalizedSegment, setPersonalizedSegment] = useState<string>('VIP_Investors (كبار المستثمرين)');

  // Priority & Schedule Controls
  const [priority, setPriority] = useState<NotificationPriority>('Urgent_Breaking');
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('2026-08-08T10:00');

  // A/B Testing State
  const [isABTest, setIsABTest] = useState<boolean>(false);
  const [titleVariantB, setTitleVariantB] = useState<string>('⚡️ استثمار 15 مليار دولار في الذكاء الاصطناعي بالرياض');
  const [bodyVariantB, setBodyVariantB] = useState<string>('اقرأ التفاصيل الكاملة لتوقيع ميثاق الحوكمة ومراكز البيانات الفائقة عبر المنصة.');
  const [splitRatio, setSplitRatio] = useState<number>(50);

  // Status & Notifications
  const [isSending, setIsSending] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Article Auto-Fill Handler
  const handleArticleSelect = (artId: string) => {
    setSelectedArticleId(artId);
    const art = articles.find((a) => a.id === artId);
    if (art) {
      setTitleInput(`🔴 عاجل | ${art.title}`);
      setBodyInput(art.summary);
      setImageUrlInput(art.mainImage);
      setArticleUrlInput(art.seoMeta?.canonicalUrl || buildArticleCanonicalUrl(art.slug || art.id));
      setTargetCategory(art.category);
      setTargetCountry(art.country);
      triggerToast(`تم استيراد بيانات الخبر (${art.category} - ${art.country}) بنجاح`);
    }
  };

  // Dispatch Campaign
  const handleDispatchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !bodyInput.trim()) {
      triggerToast('يرجى ملء عنوان ونص الإشعار أولاً');
      return;
    }

    setIsSending(true);

    setTimeout(() => {
      let targetVal: string | undefined = undefined;
      if (targetType === 'CATEGORY') targetVal = targetCategory;
      else if (targetType === 'COUNTRY') targetVal = targetCountry;
      else if (targetType === 'INTEREST') targetVal = targetInterest;

      const created = pushNotificationService.sendOrScheduleCampaign({
        title: titleInput,
        body: bodyInput,
        articleId: selectedArticleId || undefined,
        articleUrl: articleUrlInput,
        imageUrl: imageUrlInput,
        provider: selectedProvider,
        targetType,
        targetValue: targetVal,
        priority,
        isScheduled,
        scheduledAt: isScheduled ? scheduledDateTime.replace('T', ' ') : undefined,
        isABTest,
        abTestConfig: isABTest
          ? {
              titleB: titleVariantB,
              bodyB: bodyVariantB,
              splitRatioPercent: splitRatio,
            }
          : undefined,
        personalizedSegment: targetType === 'PERSONALIZED_SEGMENT' ? personalizedSegment : undefined,
      });

      setCampaigns(pushNotificationService.getCampaigns());
      setIsSending(false);

      const actionText = isScheduled ? 'جدولة' : 'بث إشعار';
      triggerToast(`تمت عملية ${actionText} بنجاح لـ ${created.deliveryCount.toLocaleString()} جهاز عبر ${created.provider}!`);
    }, 1000);
  };

  // A/B Winner Selection
  const handleSelectABWinner = (campaignId: string, winner: 'A' | 'B') => {
    const updated = pushNotificationService.declareABWinner(campaignId, winner);
    if (updated) {
      setCampaigns(pushNotificationService.getCampaigns());
      triggerToast(`تم اعتماد المتغير (${winner}) كمتغير فائز لحملة الإشعار!`);
    }
  };

  // Provider Connection Test
  const handleTestProvider = (provider: 'FCM' | 'OneSignal') => {
    const success = pushNotificationService.testProviderConnection(provider);
    setProviderConfig(pushNotificationService.getProviderConfig());
    if (success) {
      triggerToast(`تم فحص اتصال API الخاص بـ ${provider}: متصل بنجاح!`);
    } else {
      triggerToast(`فشل اتصال ${provider}! تأكد من مفتاح الخادم Server Key`);
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-indigo-900/40 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-500/30 font-bold flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              Enterprise Push Engine v5.0
            </span>
            <Badge variant="emerald">FCM & OneSignal Active</Badge>
          </div>
          <h2 className="text-2xl font-black text-white">محرك الإشعارات الفورية والتنبيهات المخصصة (Notification Engine)</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
            بث التنبيهات العاجلة والمخصصة عبر شبكتي Firebase (FCM) و OneSignal مع فلترة حسب الدولة، التصنيف، والاهتمام، بالإضافة للجدولة الزمنية واختبارات A/B Testing لقياس أعلى معدلات الفتح.
          </p>
        </div>

        {/* Live Token Metrics */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">مشتركو Firebase FCM</span>
            <strong className="text-sm font-black text-amber-400">{providerConfig.fcm.activeTokensCount.toLocaleString()} جهاز</strong>
          </div>
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-bold">مشتركو OneSignal</span>
            <strong className="text-sm font-black text-rose-400">{providerConfig.oneSignal.activePlayersCount.toLocaleString()} جهاز</strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('DISPATCH')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'DISPATCH'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>1. مركز بث الإشعارات المخصصة والعاجلة (Dispatch Studio)</span>
        </button>

        <button
          onClick={() => setActiveTab('AB_TESTING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'AB_TESTING'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Split className="w-4 h-4" />
          <span>2. اختبارات A/B Performance (A/B Testing Experiments)</span>
        </button>

        <button
          onClick={() => setActiveTab('SCHEDULED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'SCHEDULED'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>3. الإشعارات المجدولة والسجل (Scheduled Queue)</span>
          <span className="bg-indigo-700 text-white text-[10px] px-2 py-0.5 rounded-full">{campaigns.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('PROVIDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'PROVIDERS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>4. مزودات الخدمة (Firebase FCM & OneSignal)</span>
        </button>
      </div>

      {/* ================= TAB 1: DISPATCH STUDIO ================= */}
      {activeTab === 'DISPATCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Notification Configuration */}
          <div className="lg:col-span-7 space-y-6">
            <Card
              title="تكوين وتوجيه الإشعار الفوري"
              subtitle="اختر مزود الخدمة، استهدف الفئة (عاجل، تصنيف، دولة، اهتمام، أو شريحة مخصصة) وجدول الموعد"
            >
              <form onSubmit={handleDispatchCampaign} className="space-y-4">
                {/* Provider Selector: Firebase vs OneSignal vs Hybrid */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-indigo-600" />
                    اختيار شبكة ومزود الإشعارات (Push Provider):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Firebase_FCM', label: 'Firebase FCM', badge: '3.42M Tokens', color: 'border-amber-400 bg-amber-50/50' },
                      { id: 'OneSignal', label: 'OneSignal', badge: '2.15M Players', color: 'border-rose-400 bg-rose-50/50' },
                      { id: 'Hybrid_Dual', label: 'مزدوج (FCM + OneSignal)', badge: '5.57M الأجهزة', color: 'border-indigo-500 bg-indigo-50/50' },
                    ].map((p) => {
                      const isSelected = selectedProvider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProvider(p.id as NotificationProvider)}
                          className={`p-3 rounded-xl border text-right transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block text-xs font-black">{p.label}</span>
                          <span className={`text-[10px] font-bold block mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {p.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Article Picker for Quick Auto-Fill */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    تعبئة تلقائية سريعة من مقال إخباري:
                  </label>
                  <select
                    value={selectedArticleId}
                    onChange={(e) => handleArticleSelect(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- اختر مقالاً للتعبئة المباشرة --</option>
                    {articles.map((art) => (
                      <option key={art.id} value={art.id}>
                        [{art.category} - {art.country}] {art.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title & Body */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">عنوان الإشعار (Title):</label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">نص تفاصيل الإشعار (Body):</label>
                  <textarea
                    rows={2}
                    value={bodyInput}
                    onChange={(e) => setBodyInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Image URL & Canonical URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      صورة الإشعار (Rich Media Image):
                    </label>
                    <input
                      type="text"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                      رابط التوجيه المباشر (Deep Link URL):
                    </label>
                    <input
                      type="text"
                      value={articleUrlInput}
                      onChange={(e) => setArticleUrlInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Target Strategy Selector */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-indigo-600" />
                    نوع الاستهداف الشريحي (Targeting Method):
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'BREAKING_SUBSCRIBERS', label: '🔴 الأخبار العاجلة', icon: Flame },
                      { id: 'ALL', label: '🌐 جميع المستخدمين', icon: Globe },
                      { id: 'CATEGORY', label: '📂 حسب التصنيف', icon: Filter },
                      { id: 'COUNTRY', label: '🇸🇦 حسب الدولة', icon: Globe },
                      { id: 'INTEREST', label: '💡 حسب الاهتمام', icon: Sparkles },
                      { id: 'PERSONALIZED_SEGMENT', label: '🎯 شريحة مخصصة VIP', icon: UserCheck },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = targetType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTargetType(t.id as NotificationTargetType)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Target Criteria Selectors */}
                  {targetType === 'CATEGORY' && (
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                      <label className="block text-xs font-bold text-indigo-900 mb-1">اختر التصنيف الإخباري المستهدف:</label>
                      <select
                        value={targetCategory}
                        onChange={(e) => setTargetCategory(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-950"
                      >
                        {NEWS_CATEGORIES.filter((c) => c !== 'الكل').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {targetType === 'COUNTRY' && (
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                      <label className="block text-xs font-bold text-indigo-900 mb-1">اختر الدولة المستهدفة:</label>
                      <select
                        value={targetCountry}
                        onChange={(e) => setTargetCountry(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-950"
                      >
                        {COUNTRIES.filter((c) => c !== 'جميع الدول').map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {targetType === 'INTEREST' && (
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                      <label className="block text-xs font-bold text-indigo-900 mb-1">اختر الاهتمام المستهدف:</label>
                      <select
                        value={targetInterest}
                        onChange={(e) => setTargetInterest(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-950"
                      >
                        {INTERESTS_LIST.map((int) => (
                          <option key={int} value={int}>
                            {int}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {targetType === 'PERSONALIZED_SEGMENT' && (
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                      <label className="block text-xs font-bold text-indigo-900 mb-1">اختر الشريحة المخصصة (Personalized User Segment):</label>
                      <select
                        value={personalizedSegment}
                        onChange={(e) => setPersonalizedSegment(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-950"
                      >
                        {USER_SEGMENTS.map((seg) => (
                          <option key={seg} value={seg}>
                            {seg}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Scheduling & A/B Testing Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Schedule Checkbox */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        جدولة الإشعار لزمن لاحق
                      </span>
                    </label>

                    {isScheduled && (
                      <input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-900"
                      />
                    )}
                  </div>

                  {/* A/B Test Checkbox */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isABTest}
                        onChange={(e) => setIsABTest(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Split className="w-3.5 h-3.5 text-indigo-600" />
                        تفعيل اختبار A/B Testing
                      </span>
                    </label>

                    {isABTest && (
                      <span className="text-[11px] text-indigo-700 font-bold block">
                        تم تفعيل المتغيرين A & B (انتقل لتبويب A/B للتحكم)
                      </span>
                    )}
                  </div>
                </div>

                {/* A/B Test Inputs when enabled */}
                {isABTest && (
                  <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 space-y-3">
                    <span className="text-xs font-bold text-indigo-950 block">متغير المتلقي الثاني (Variant B):</span>
                    <div>
                      <input
                        type="text"
                        placeholder="عنوان المتغير B..."
                        value={titleVariantB}
                        onChange={(e) => setTitleVariantB(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-950 mb-2"
                      />
                      <textarea
                        rows={2}
                        placeholder="نص المتغير B..."
                        value={bodyVariantB}
                        onChange={(e) => setBodyVariantB(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs text-indigo-950"
                      />
                    </div>
                  </div>
                )}

                {/* Dispatch Button */}
                <Button variant="primary" size="lg" className="w-full justify-center gap-2 text-xs font-black shadow-lg">
                  {isSending ? (
                    <span>جاري بث وتوجيه الإشعار...</span>
                  ) : isScheduled ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>جدولة الإشعار المخصص لـ {scheduledDateTime.replace('T', ' ')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>بث الإشعار الفوري الآن عبر {selectedProvider}</span>
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Panel: Interactive Smartphone Lockscreen Simulation */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              المعاينة التفاعلية على شاشة القفل (Mobile Lockscreen Simulation)
            </h3>

            {/* Simulated Phone Frame */}
            <div className="mx-auto max-w-sm bg-slate-950 rounded-[40px] p-4 border-4 border-slate-800 shadow-2xl text-white font-sans space-y-4">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-3 pt-1">
                <span className="font-bold">09:41</span>
                <div className="w-16 h-3 bg-slate-900 rounded-full mx-auto border border-slate-800" />
                <span className="font-bold">5G 100%</span>
              </div>

              {/* Lockscreen Notification Cards */}
              <div className="space-y-3 py-2">
                {/* Variant A Lockscreen Notification */}
                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3.5 border border-slate-800/80 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white font-black text-[9px]">
                        N
                      </div>
                      <span className="font-bold text-slate-200">أخبار نوعية • الآن</span>
                    </div>
                    <Badge variant={selectedProvider === 'Firebase_FCM' ? 'amber' : selectedProvider === 'OneSignal' ? 'rose' : 'indigo'}>
                      {selectedProvider}
                    </Badge>
                  </div>

                  <p className="font-bold text-xs text-white leading-snug">{titleInput || 'عنوان الإشعار...'}</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">{bodyInput || 'نص الإشعار...'}</p>

                  {imageUrlInput && (
                    <img src={imageUrlInput} alt="Notification Media" className="w-full h-28 object-cover rounded-xl mt-2" />
                  )}

                  <div className="flex items-center justify-between text-[10px] text-indigo-300 pt-1 border-t border-slate-800">
                    <span>انقر لفتح التغطية المباشرة ➔</span>
                    <span className="font-mono text-slate-500">{priority}</span>
                  </div>
                </div>

                {/* Variant B Preview if A/B enabled */}
                {isABTest && (
                  <div className="bg-indigo-950/80 backdrop-blur-md rounded-2xl p-3.5 border border-indigo-700/80 shadow-lg space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-indigo-300">
                      <span className="font-bold">أخبار نوعية (Variant B - A/B Test)</span>
                      <Badge variant="indigo">Variant B</Badge>
                    </div>
                    <p className="font-bold text-xs text-white">{titleVariantB || 'عنوان المتغير B'}</p>
                    <p className="text-[11px] text-indigo-200 line-clamp-2">{bodyVariantB || 'نص المتغير B'}</p>
                  </div>
                )}
              </div>

              {/* Lockscreen Bottom Swipe Bar */}
              <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto" />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: A/B TESTING EXPERIMENTS ================= */}
      {activeTab === 'AB_TESTING' && (
        <Card
          title="2. قسم اختبارات A/B وتقييم معدلات الفتح (A/B Testing Experiments)"
          subtitle="تحليل وتقييم نتائج المتغيرين A و B، وقياس الـ Click-Through Rate (CTR) واعتماد الفائز آلياً"
        >
          <div className="space-y-6">
            {campaigns
              .filter((c) => c.isABTest && c.abTestConfig)
              .map((camp) => {
                const ab = camp.abTestConfig!;
                return (
                  <div key={camp.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="indigo">تجربة A/B Testing</Badge>
                          <span className="text-xs font-mono text-slate-500">ID: {camp.id}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">{camp.title}</h3>
                      </div>

                      {ab.winningVariant ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">المتغير الفائز المعلن:</span>
                          <Badge variant="emerald" className="px-3 py-1 text-xs">
                            🏆 Variant {ab.winningVariant}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="amber">التجربة قيد القياس الفوري</Badge>
                      )}
                    </div>

                    {/* Side-by-Side Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Variant A */}
                      <div className={`p-4 rounded-xl border ${ab.winningVariant === 'A' ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/30' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-slate-900">المتغير A (Variant A)</span>
                          <Badge variant={ab.winningVariant === 'A' ? 'emerald' : 'indigo'}>
                            فتح: {ab.variantA.openRatePercent}%
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-slate-800">{ab.variantA.title}</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ab.variantA.body}</p>

                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">الأجهزة</span>
                            <strong className="text-xs font-bold text-slate-800">{ab.variantA.deliveryCount.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">مرات الفتح</span>
                            <strong className="text-xs font-bold text-indigo-600">{ab.variantA.openCount.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">النقرات CTR</span>
                            <strong className="text-xs font-bold text-emerald-600">{ab.variantA.ctrPercent}%</strong>
                          </div>
                        </div>

                        {!ab.winningVariant && (
                          <Button variant="outline" size="xs" onClick={() => handleSelectABWinner(camp.id, 'A')} className="w-full mt-3">
                            اعتماد Variant A كفائز
                          </Button>
                        )}
                      </div>

                      {/* Variant B */}
                      <div className={`p-4 rounded-xl border ${ab.winningVariant === 'B' ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/30' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-slate-900">المتغير B (Variant B)</span>
                          <Badge variant={ab.winningVariant === 'B' ? 'emerald' : 'rose'}>
                            فتح: {ab.variantB.openRatePercent}%
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-slate-800">{ab.variantB.title}</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ab.variantB.body}</p>

                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">الأجهزة</span>
                            <strong className="text-xs font-bold text-slate-800">{ab.variantB.deliveryCount.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">مرات الفتح</span>
                            <strong className="text-xs font-bold text-indigo-600">{ab.variantB.openCount.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">النقرات CTR</span>
                            <strong className="text-xs font-bold text-emerald-600">{ab.variantB.ctrPercent}%</strong>
                          </div>
                        </div>

                        {!ab.winningVariant && (
                          <Button variant="outline" size="xs" onClick={() => handleSelectABWinner(camp.id, 'B')} className="w-full mt-3">
                            اعتماد Variant B كفائز
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* ================= TAB 3: SCHEDULED & QUEUE ================= */}
      {activeTab === 'SCHEDULED' && (
        <Card title="3. سجل طابور الإشعارات المرسلة والمجدولة" subtitle="متابعة فورية للحملات السابقة والتنبيهات المجدولة مستقبلاً">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">عنوان الإشعار</th>
                  <th className="p-3">المزود</th>
                  <th className="p-3">الشريحة المستهدفة</th>
                  <th className="p-3">الأولوية</th>
                  <th className="p-3">حالة البث</th>
                  <th className="p-3">التاريخ / الموعد</th>
                  <th className="p-3">الأجهزة المستلمة</th>
                  <th className="p-3">معدل الفتح CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900 max-w-xs truncate">{c.title}</td>
                    <td className="p-3">
                      <Badge variant={c.provider === 'Firebase_FCM' ? 'amber' : c.provider === 'OneSignal' ? 'rose' : 'indigo'}>
                        {c.provider}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-600">{c.targetAudience}</td>
                    <td className="p-3">
                      <Badge variant={c.priority === 'Urgent_Breaking' ? 'rose' : 'neutral'}>
                        {c.priority}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={c.status === 'Sent' ? 'emerald' : c.status === 'Scheduled' ? 'amber' : 'neutral'}>
                        {c.status === 'Sent' ? 'تم البث' : 'مجدول'}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{c.sentAt || c.scheduledAt}</td>
                    <td className="p-3 font-bold text-slate-800">{c.deliveryCount.toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-600">{c.openRatePercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ================= TAB 4: PROVIDERS & CONNECTIONS ================= */}
      {activeTab === 'PROVIDERS' && (
        <Card title="4. إعدادات المزودات والاتصال (Firebase FCM & OneSignal)" subtitle="إدارة مفاتيح الـ API وربط الحسابات السحابية للبث الفائق">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Firebase FCM Card */}
            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center text-sm">
                    FCM
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Google Firebase Cloud Messaging</h3>
                    <span className="text-[11px] text-slate-500 block font-mono">Project ID: {providerConfig.fcm.projectId}</span>
                  </div>
                </div>
                <Badge variant={providerConfig.fcm.status === 'Connected' ? 'emerald' : 'rose'}>
                  {providerConfig.fcm.status}
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-white rounded-lg border border-amber-100">
                  <span className="text-slate-600">الأجهزة والأدلة النشطة (Tokens):</span>
                  <strong className="text-amber-900 font-bold">{providerConfig.fcm.activeTokensCount.toLocaleString()} جهاز</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded-lg border border-amber-100">
                  <span className="text-slate-600">حالة مفتاح الخادم Server Key:</span>
                  <strong className="text-emerald-700 font-bold">مكون ومفعل ✅</strong>
                </div>
              </div>

              <Button variant="outline" size="xs" onClick={() => handleTestProvider('FCM')} className="w-full">
                اختبار الاتصال بـ Firebase FCM API
              </Button>
            </div>

            {/* OneSignal Card */}
            <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-black flex items-center justify-center text-sm">
                    OS
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">OneSignal Push Platform</h3>
                    <span className="text-[11px] text-slate-500 block font-mono">App ID: {providerConfig.oneSignal.appId}</span>
                  </div>
                </div>
                <Badge variant={providerConfig.oneSignal.status === 'Connected' ? 'emerald' : 'rose'}>
                  {providerConfig.oneSignal.status}
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-white rounded-lg border border-rose-100">
                  <span className="text-slate-600">المستلمون النشطون (Players):</span>
                  <strong className="text-rose-900 font-bold">{providerConfig.oneSignal.activePlayersCount.toLocaleString()} جهاز</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded-lg border border-rose-100">
                  <span className="text-slate-600">حالة الربط REST API Key:</span>
                  <strong className="text-emerald-700 font-bold">متصل بـ OneSignal v11 ✅</strong>
                </div>
              </div>

              <Button variant="outline" size="xs" onClick={() => handleTestProvider('OneSignal')} className="w-full">
                اختبار الاتصال بـ OneSignal API
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
