import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Sliders,
  Globe,
  Clock,
  ShieldCheck,
  Cpu,
  Key,
  Database,
  CheckCircle2,
} from 'lucide-react';

interface SystemSettingsCenterProps {
  triggerToast: (msg: string) => void;
}

export const SystemSettingsCenter: React.FC<SystemSettingsCenterProps> = ({ triggerToast }) => {
  const [siteName, setSiteName] = useState('أخبار نوعية — Naw3iya News');
  const [defaultCountry, setDefaultCountry] = useState('اليمن (Yemen)');
  const [defaultLanguage, setDefaultLanguage] = useState('العربية (Arabic)');
  const [defaultCurrency, setDefaultCurrency] = useState('الريال اليمني (YER)');
  const [timezone, setTimezone] = useState('Asia/Aden (صنعاء / عدن)');
  const [aiModel, setAiModel] = useState('Gemini 2.5 Flash');
  const [fetchIntervalMinutes, setFetchIntervalMinutes] = useState('3');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('تم حفظ إعدادات النظام وتحديث المنطقة الزمنية (Asia/Aden) بنجاح');
  };

  return (
    <div dir="rtl" className="space-y-6">
      <Card
        title="إعدادات النظام والمنطقة الزمنية الإقليمية"
        subtitle="ضبط الخيارات الافتراضية للجمهور، النماذج، ومفاتيح البيئة المفصولة"
      >
        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
          {/* Platform Identity & Regional Defaults */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>هوية المنصة والإعدادات الإقليمية الافتراضية</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المنصة الرسمي</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الدولة الافتراضية</label>
                <input
                  type="text"
                  disabled
                  value={defaultCountry}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">اللغة الرسمية</label>
                <input
                  type="text"
                  disabled
                  value={defaultLanguage}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">المنطقة الزمنية (Server Timezone)</label>
                <input
                  type="text"
                  disabled
                  value={timezone}
                  className="w-full p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl font-bold font-mono text-indigo-900"
                />
              </div>
            </div>
          </div>

          {/* Engine & AI Settings */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>إعدادات محرك الجلب وذكاء Gemini الاصطناعي</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نموذج الذكاء الاصطناعي الرئيسي</label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:outline-none"
                >
                  <option value="Gemini 2.5 Flash">Gemini 2.5 Flash (موصى به - أسرع وأقل استهلاكاً)</option>
                  <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (للتحليلات المعقدة والمقالات الطويلة)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">معدل تكرار الجلب المبرمج (بالدقائق)</label>
                <select
                  value={fetchIntervalMinutes}
                  onChange={(e) => setFetchIntervalMinutes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:outline-none"
                >
                  <option value="1">كل دقيقة</option>
                  <option value="3">كل 3 دقائق (افتراضي)</option>
                  <option value="5">كل 5 دقائق</option>
                  <option value="10">كل 10 دقائق</option>
                </select>
              </div>
            </div>
          </div>

          {/* Secrets Management Overview */}
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-indigo-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>حالة المفاتيح والأسرار البرمجية (Environment Secrets)</span>
              </span>
              <Badge variant="emerald">آمنة ومحمية سيرفر-سايد</Badge>
            </div>

            <div className="space-y-2 text-[11px] font-mono text-slate-300">
              <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                <span>DATABASE_URL (PostgreSQL connection)</span>
                <span className="text-emerald-400 font-bold">●●●●●●●● [SET]</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                <span>GEMINI_API_KEY (Server-side AI)</span>
                <span className="text-emerald-400 font-bold">●●●●●●●● [SET]</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-xs">
              حفظ الإعدادات العامة
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
