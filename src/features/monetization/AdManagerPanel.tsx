import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AdPlacement } from '../../types';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Eye,
  MousePointer,
  Tv,
  Smartphone,
  ShieldAlert,
  Power
} from 'lucide-react';

const INITIAL_ADS: AdPlacement[] = [
  {
    id: 'ad-hdr',
    name: 'بانر الهيدر الرئيسي - Header Banner',
    type: 'Banner',
    provider: 'Google Ad Manager',
    status: 'Active',
    impressions: 4820000,
    clicks: 142000,
    estimatedRevenueUSD: 18400,
  },
  {
    id: 'ad-native',
    name: 'إعلان مدمج بآخر الأخبار - Native Feed Ad',
    type: 'Native',
    provider: 'AdMob',
    status: 'Active',
    impressions: 9120000,
    clicks: 391000,
    estimatedRevenueUSD: 41200,
  },
  {
    id: 'ad-article',
    name: 'إعلان وسط مقال القراءة - In-Article Banner',
    type: 'InArticle',
    provider: 'Google Ad Manager',
    status: 'Active',
    impressions: 6100000,
    clicks: 215000,
    estimatedRevenueUSD: 29800,
  },
  {
    id: 'ad-inter',
    name: 'إعلان شاشة كاملة عند التنقل - Interstitial',
    type: 'Interstitial',
    provider: 'Custom Direct',
    status: 'Disabled',
    impressions: 1200000,
    clicks: 89000,
    estimatedRevenueUSD: 12500,
  }
];

export const AdManagerPanel: React.FC = () => {
  const [ads, setAds] = useState<AdPlacement[]>(INITIAL_ADS);

  const toggleAdStatus = (id: string) => {
    setAds((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, status: ad.status === 'Active' ? 'Disabled' : 'Active' } : ad))
    );
  };

  const totalRevenue = ads.reduce((acc, curr) => acc + curr.estimatedRevenueUSD, 0);
  const totalImpressions = ads.reduce((acc, curr) => acc + curr.impressions, 0);

  return (
    <div dir="rtl" className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-emerald-900 text-white border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-200">إجمالي الأرباح الإعلانية المقدّرة</p>
              <h3 className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString('en-US')}</h3>
              <p className="text-[11px] text-emerald-300 mt-1">+18.4% مقارنة بالشهر الماضي</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-300" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">إجمالي الظهور (Impressions)</p>
              <h3 className="text-2xl font-bold mt-1">{totalImpressions.toLocaleString('ar-EG')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">معدل التعبئة Fill Rate: 98.6%</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Eye className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">متوسط عائد الألف ظهور (eCPM)</p>
              <h3 className="text-2xl font-bold mt-1">$4.85</h3>
              <p className="text-[11px] text-slate-400 mt-1">أعلى أداء: الإعلانات المدمجة</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Ad Placements List */}
      <Card
        title="إدارة المساحات الإعلانية ومزودي الخدمة (Ad Manager & AdMob)"
        subtitle="التحكم في المساحات الإعلانية الموزعة على الموقع ومحاكي التطبيق لضمان أفضل تجربة مستخدم مع تعظيم العوائد"
      >
        <div className="space-y-4">
          {ads.map((ad) => {
            const ctr = ((ad.clicks / ad.impressions) * 100).toFixed(2);
            return (
              <div
                key={ad.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{ad.name}</h4>
                    <Badge variant={ad.status === 'Active' ? 'emerald' : 'neutral'}>
                      {ad.status === 'Active' ? 'نشط' : 'معطل'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>المزود: <strong className="text-slate-800">{ad.provider}</strong></span>
                    <span>•</span>
                    <span>نوع الإعلان: <strong className="text-slate-800">{ad.type}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">الظهور</span>
                    <span className="font-bold text-slate-800">{ad.impressions.toLocaleString('ar-EG')}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">معدل النقر CTR</span>
                    <span className="font-bold text-indigo-600">{ctr}%</span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">الإيرادات</span>
                    <span className="font-bold text-emerald-600">${ad.estimatedRevenueUSD.toLocaleString('en-US')}</span>
                  </div>

                  <Button
                    variant={ad.status === 'Active' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => toggleAdStatus(ad.id)}
                  >
                    <Power className="w-3.5 h-3.5 ml-1" />
                    {ad.status === 'Active' ? 'إيقاف' : 'تفعيل'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
