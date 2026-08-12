import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { NewsSource, NewsSourceProtocol } from '../../core';
import { Plus, Globe, Key, Clock, ShieldCheck, Tag, Flag } from 'lucide-react';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (newSource: NewsSource) => void;
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  onAddSource,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [protocol, setProtocol] = useState<NewsSourceProtocol>('RSS');
  const [category, setCategory] = useState('سياسة');
  const [country, setCountry] = useState('السعودية');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [fetchFrequencyMinutes, setFetchFrequencyMinutes] = useState(5);
  const [reliabilityRating, setReliabilityRating] = useState(5);
  const [apiKey, setApiKey] = useState('');
  const [logo, setLogo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    const source: NewsSource = {
      id: `src-custom-${Date.now()}`,
      name,
      logo:
        logo ||
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
      url,
      type: protocol,
      category,
      country,
      language,
      priority,
      reliabilityRating,
      fetchFrequencyMinutes,
      status: 'Active',
      lastFetchedAt: 'الآن',
      articlesCountToday: 0,
      apiKey: apiKey || undefined,
    };

    onAddSource(source);
    onClose();

    // Reset form
    setName('');
    setUrl('');
    setApiKey('');
    setLogo('');
  };

  const protocolOptions: { value: NewsSourceProtocol; label: string }[] = [
    { value: 'RSS', label: 'تغذية RSS' },
    { value: 'Atom', label: 'تغذية Atom' },
    { value: 'XML', label: 'تغذية XML' },
    { value: 'JSON', label: 'تغذية JSON' },
    { value: 'REST_API', label: 'واجهة REST API' },
    { value: 'Google_News', label: 'Google News API' },
    { value: 'NewsAPI', label: 'NewsAPI Engine' },
    { value: 'GNews', label: 'GNews Middle East' },
    { value: 'Mediastack', label: 'Mediastack API' },
    { value: 'NewsData_io', label: 'NewsData.io API' },
    { value: 'Guardian', label: 'The Guardian API' },
    { value: 'NYT', label: 'New York Times API' },
    { value: 'Reuters', label: 'موصل رويترز (Reuters)' },
    { value: 'BBC', label: 'موصل بي بي سي (BBC)' },
    { value: 'CNN', label: 'سي إن إن بالعربية (CNN)' },
    { value: 'AlJazeera', label: 'الجزيرة نت (Al Jazeera)' },
    { value: 'AlArabiya', label: 'العربية (Al Arabiya)' },
    { value: 'SkyNews', label: 'سكاي نيوز عربية (Sky News)' },
    { value: 'Scraper', label: 'أداة كشط المواقع (Scraper)' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إضافة مصدر إخباري جديد للشبكة" maxWidth="2xl">
      <form dir="rtl" onSubmit={handleSubmit} className="space-y-4 text-xs">
        <p className="text-slate-500 border-b border-slate-100 pb-2">
          أضف أي بروتوكول أو مصدر إخباري محلي أو عالمي ليتم تضمينه تلقائياً في طابور السحب وجدولة الـ 5 دقائق.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">اسم المصدر الإخباري *</label>
            <input
              type="text"
              required
              placeholder="مثال: وكالة الأنباء الألمانية (DPA)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">نوع البروتوكول / المصدر *</label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as NewsSourceProtocol)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 font-semibold text-indigo-700"
            >
              {protocolOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">رابط الملقم / Feed URL or API Endpoint *</label>
          <div className="relative">
            <Globe className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="url"
              required
              placeholder="https://example.com/rss.xml أو https://api.news.com/v1/latest"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 p-2.5 focus:ring-2 focus:ring-indigo-500 text-left dir-ltr"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              التصنيف الرئيسية
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="سياسة">سياسة</option>
              <option value="اقتصاد">اقتصاد</option>
              <option value="تكنولوجيا">تكنولوجيا</option>
              <option value="رياضة">رياضة</option>
              <option value="علوم">علوم وصحة</option>
              <option value="عاجل">عاجل</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-slate-400" />
              الدولة / المنطقة
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="السعودية">السعودية</option>
              <option value="الإمارات">الإمارات</option>
              <option value="قطر">قطر</option>
              <option value="الكويت">الكويت</option>
              <option value="مصر">مصر</option>
              <option value="أمريكا">أمريكا</option>
              <option value="بريطانيا">بريطانيا</option>
              <option value="عالمي">عالمي</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">اللغة الرئيسية</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ar">العربية (Arabic)</option>
              <option value="en">الإنجليزي (English)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">أولوية السحب في الطابور</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 font-bold"
            >
              <option value="High" className="text-rose-600">عالية (High - أولية)</option>
              <option value="Medium" className="text-amber-600">متوسطة (Medium)</option>
              <option value="Low" className="text-slate-600">منخفضة (Low)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              فترة التحديث (بالدقائق)
            </label>
            <select
              value={fetchFrequencyMinutes}
              onChange={(e) => setFetchFrequencyMinutes(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>كل دقيقة واحدة</option>
              <option value={3}>كل 3 دقائق</option>
              <option value={5}>كل 5 دقائق (افتراضي)</option>
              <option value={10}>كل 10 دقائق</option>
              <option value={15}>كل 15 دقيقة</option>
              <option value={30}>كل 30 دقيقة</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              درجة الموثوقية (1 - 5)
            </label>
            <select
              value={reliabilityRating}
              onChange={(e) => setReliabilityRating(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 text-emerald-600 font-bold"
            >
              <option value={5}>★★★★★ (5/5 موثوقية رسمية)</option>
              <option value={4}>★★★★☆ (4/5 مصادر صحفية الكبرى)</option>
              <option value={3}>★★★☆☆ (3/5 موصل عادي)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              مفتاح API الخاص بالمصدر (اختياري)
            </label>
            <input
              type="text"
              placeholder="مثال: api_key_xyz123"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 text-left dir-ltr"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">رابط الشعار Logo (اختياري)</label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 text-left dir-ltr"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit">
            <Plus className="w-4 h-4 ml-1.5" />
            حفظ وإضافة إلى طابور السحب
          </Button>
        </div>
      </form>
    </Modal>
  );
};
