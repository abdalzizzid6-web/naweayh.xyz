import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Sparkles, Check, Globe, Sliders, ShieldCheck, Bell } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePreferences: (prefs: {
    categories: string[];
    countries: string[];
    sources: string[];
    notificationsEnabled: boolean;
  }) => void;
  initialPreferences?: {
    categories: string[];
    countries: string[];
    sources: string[];
    notificationsEnabled: boolean;
  };
}

const CATEGORY_OPTIONS = [
  'اليمن',
  'العرب والعالم',
  'سياسة',
  'اقتصاد',
  'تقنية',
  'رياضة',
  'صحة',
  'علوم',
  'ثقافة',
  'سيارات',
  'فيديو',
];

const COUNTRY_OPTIONS = [
  'اليمن',
  'السعودية',
  'مصر',
  'الإمارات',
  'قطر',
  'الكويت',
  'عمان',
  'الأردن',
  'عالمي',
];

const SOURCE_OPTIONS = [
  { id: 'spa', name: 'وكالة الأنباء الرسمية (SPA)', trust: 99 },
  { id: 'reuters', name: 'رويترز العربية', trust: 97 },
  { id: 'saba', name: 'وكالة الأنباء اليمنية (سبأ)', trust: 95 },
  { id: 'aljazeera', name: 'الجزيرة نت', trust: 96 },
  { id: 'alarabiya', name: 'العربية نت', trust: 96 },
  { id: 'asharq', name: 'الشرق الأوسط', trust: 94 },
  { id: 'skynews', name: 'سكاي نيوز عربية', trust: 95 },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSavePreferences,
  initialPreferences,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialPreferences?.categories || ['اليمن', 'سياسة', 'اقتصاد', 'تقنية']
  );
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialPreferences?.countries || ['اليمن', 'السعودية', 'عالمي']
  );
  const [selectedSources, setSelectedSources] = useState<string[]>(
    initialPreferences?.sources || ['spa', 'reuters', 'saba', 'aljazeera']
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    initialPreferences?.notificationsEnabled ?? true
  );

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleCountry = (country: string) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter((c) => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      setSelectedSources(selectedSources.filter((s) => s !== sourceId));
    } else {
      setSelectedSources([...selectedSources, sourceId]);
    }
  };

  const handleSave = () => {
    onSavePreferences({
      categories: selectedCategories,
      countries: selectedCountries,
      sources: selectedSources,
      notificationsEnabled,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="2xl">
      <div dir="rtl" className="space-y-6 -mt-2">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-12 h-12 bg-indigo-600/10 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 ring-4 ring-indigo-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            تخصيص موجزك الإخباري الذكي ("أخبارك")
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            حدد اهتماماتك والأقسام والمصادر المفضلة لديك ليقوم محرك الذكاء الاصطناعي بتخصيص الصفحة الرئيسية وتنبيهات الأخبار العاجلة بناءً على اختيارك.
          </p>
        </div>

        {/* Section 1: Categories */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            الأقسام والاهتمامات الرئيسية:
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Countries */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-sky-600" />
            الدول والمناطق المتابعة:
          </label>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_OPTIONS.map((cnt) => {
              const isSelected = selectedCountries.includes(cnt);
              return (
                <button
                  key={cnt}
                  onClick={() => toggleCountry(cnt)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  {cnt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Preferred Sources */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            المصادر الموصى بها لمتابعتها:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SOURCE_OPTIONS.map((src) => {
              const isSelected = selectedSources.includes(src.id);
              return (
                <div
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                        isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {src.name}
                    </span>
                  </div>
                  <Badge variant="emerald" className="text-[10px]">
                    موثوقية {src.trust}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Notification Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-rose-500" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                تفعيل تنبيهات الأخبار العاجلة المباشرة
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                استقبل شريط الأنباء العاجلة والموجز الهام تلقائياً
              </span>
            </div>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                notificationsEnabled ? 'translate-x-0' : '-translate-x-5'
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} className="gap-1.5 font-bold">
            <Check className="w-4 h-4" />
            حفظ الاهتمامات وتنسيق الموجز
          </Button>
        </div>
      </div>
    </Modal>
  );
};
