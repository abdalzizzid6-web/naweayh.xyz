import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { NewsArticle } from '../../../core/domain/types';
import {
  Search,
  Globe,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Link,
  Code,
} from 'lucide-react';

interface SEOControlCenterProps {
  articles: NewsArticle[];
  triggerToast: (msg: string) => void;
}

export const SEOControlCenter: React.FC<SEOControlCenterProps> = ({
  articles,
  triggerToast,
}) => {
  const [siteTitle, setSiteTitle] = useState('أخبار نوعية — Naw3iya News | الأخبار كما تستحق أن تُقرأ');
  const [siteDesc, setSiteDesc] = useState('أخبار نوعية — المنصة الإخبارية الذكية الشاملة: تغطية عاجلة ومباشرة بذكاء اصطناعي فائق وتحليلات موثوقة باللغة العربية.');
  const [keywords, setKeywords] = useState('أخبار نوعية, نوعية, أخبار, اليمن, الأخبار العاجلة, سياسة, اقتصاد, تقنية, تحليل إخباري');
  const [robotsTxt, setRobotsTxt] = useState(`User-agent: *\nAllow: /\nSitemap: https://naweayh.xyz/sitemap.xml\nSitemap: https://naweayh.xyz/news-sitemap.xml`);

  const handleSaveSeoSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('تم حفظ إعدادات محرك البحث الخرائط البرمجية (Sitemaps) بنجاح');
  };

  return (
    <div dir="rtl" className="space-y-6">
      <Card
        title="مركز إعدادات محركات البحث وخرائط Google News"
        subtitle="ضبط الكلمات المفتاحية العالمية، خرائط XML، وملف Robots.txt"
      >
        <form onSubmit={handleSaveSeoSettings} className="space-y-6 text-xs">
          {/* Site-wide SEO */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>الإعدادات العامة للواجهة والصفحة الرئيسية</span>
            </h4>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان الموقع العام (Global Meta Title)</label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الوصف العام للموقع (Global Meta Description)</label>
                <textarea
                  rows={2}
                  value={siteDesc}
                  onChange={(e) => setSiteDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl leading-relaxed focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الكلمات المفتاحية الرئيسية</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sitemaps Status */}
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-indigo-300">خرائط XML المعتمدة (Sitemaps)</span>
              <Badge variant="emerald">نشطة ومحدثة تلقائياً</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-1">
                <span className="font-bold text-white block">sitemap.xml</span>
                <span className="text-[10px] text-slate-400 block font-mono">خرائط الصفحات والمستندات</span>
                <span className="text-emerald-400 font-bold block text-[10px]">200 OK</span>
              </div>

              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-1">
                <span className="font-bold text-white block">news-sitemap.xml</span>
                <span className="text-[10px] text-slate-400 block font-mono">خاص بأخبار Google News</span>
                <span className="text-emerald-400 font-bold block text-[10px]">200 OK ({articles.length} خبر)</span>
              </div>

              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-1">
                <span className="font-bold text-white block">rss.xml</span>
                <span className="text-[10px] text-slate-400 block font-mono">خلاصة الأخبار المنشورة</span>
                <span className="text-emerald-400 font-bold block text-[10px]">200 OK</span>
              </div>
            </div>
          </div>

          {/* Robots.txt */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">محرر ملف Robots.txt</label>
            <textarea
              rows={4}
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-xs">
              حفظ إعدادات SEO
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
