import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EnterpriseAd } from '../../../repositories/enterpriseAdminRepository';
import {
  DollarSign,
  Plus,
  Megaphone,
  Eye,
  CheckCircle2,
  Image as ImageIcon,
  Sliders,
  Calendar,
} from 'lucide-react';

interface AdManagementCenterProps {
  ads: EnterpriseAd[];
  onToggleAdStatus: (id: string) => void;
  triggerToast: (msg: string) => void;
}

export const AdManagementCenter: React.FC<AdManagementCenterProps> = ({
  ads,
  onToggleAdStatus,
  triggerToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'CAMPAIGNS' | 'HERO_BANNER'>('CAMPAIGNS');

  // Hero Banners State
  const [heroBanners, setHeroBanners] = useState([
    {
      id: 'hb-1',
      title: 'قمة الذكاء الاصطناعي والتكنولوجيا المالية 2026',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      ctaText: 'سجل حضورك الآن',
      linkUrl: 'https://event.naweayh.xyz',
      isActive: true,
    },
    {
      id: 'hb-2',
      title: 'المبادرة الإقليمية لدعم الابتكار والتحول الرقمي',
      imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      ctaText: 'تعرف على التفاصيل',
      linkUrl: 'https://innovation.naweayh.xyz',
      isActive: true,
    },
  ]);

  return (
    <div dir="rtl" className="space-y-6">
      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">إدارة الحملات الإعلانية وبانر الصفحة الرئيسية</h3>
          <p className="text-xs text-slate-500 mt-0.5">التحكم في مواضع الإعلانات، البانر الرئيسي الهيرو، والتحليلات التجارية</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('CAMPAIGNS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'CAMPAIGNS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الحملات الإعلانية ({ads.length})
          </button>
          <button
            onClick={() => setActiveSubTab('HERO_BANNER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'HERO_BANNER' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            بانر الواجهة الهيرو (Hero Carousel)
          </button>
        </div>
      </div>

      {/* CAMPAIGNS SUBTAB */}
      {activeSubTab === 'CAMPAIGNS' && (
        <Card
          title="قائمة الحملات الإعلانية والمواضع المعتمدة"
          subtitle="تحديد أماكن الظهور (الهيرو، بين الأخبار، أعلى المقال، الشريط الجانبي)"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">{ad.title}</h4>
                  </div>
                  <Badge variant={ad.status === 'Active' ? 'emerald' : 'amber'}>
                    {ad.status === 'Active' ? 'نشطة' : 'متوقفة'}
                  </Badge>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-slate-500 block">الموقع: <strong className="text-indigo-600">{ad.placement}</strong></span>
                  <span className="text-slate-500 block">الظهور الحقيقي: <strong className="text-slate-900 font-mono">{ad.impressions.toLocaleString()} مرة</strong></span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      onToggleAdStatus(ad.id);
                      triggerToast(`تم تعديل حالة الحملة (${ad.title})`);
                    }}
                    className="text-xs"
                  >
                    {ad.status === 'Active' ? 'تجميد' : 'تفعيل'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* HERO BANNER CAROUSEL MANAGER */}
      {activeSubTab === 'HERO_BANNER' && (
        <Card
          title="إدارة البانر الترويجي الإعلاني الرئيسي في أصل الواجهة"
          subtitle="سلايدر متحرك بالواجهة يعرض الفعاليات والحملات الكبرى"
        >
          <div className="space-y-4">
            <div className="space-y-3">
              {heroBanners.map((hb) => (
                <div key={hb.id} className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={hb.imageUrl} alt={hb.title} className="w-16 h-12 rounded-lg object-cover border border-slate-700" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{hb.title}</h4>
                      <span className="text-[10px] text-indigo-300 font-mono">{hb.linkUrl}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="xs" onClick={() => triggerToast('تم حفظ تعديل البانر')}>
                      تعديل
                    </Button>
                    <Badge variant="emerald">نشط بالواجهة</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
