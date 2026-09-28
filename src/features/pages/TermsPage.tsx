import React from 'react';
import { FileCheck, ArrowRight, ShieldCheck, CheckCircle2, AlertOctagon, Scale } from 'lucide-react';
import { SEOHead } from '../../seo-engine/SEOHead';

interface TermsPageProps {
  onNavigateHome: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigateHome }) => {
  return (
    <div dir="rtl" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans text-slate-800 dark:text-slate-100">
      <SEOHead staticPage="terms" />
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>
        <span className="text-xs text-slate-500">شروط الاستخدام — naweayh.xyz</span>
      </div>

      <header className="mb-8">
        <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-700 dark:text-emerald-400 mb-3">
          <FileCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          شروط الاستخدام والخدمة (Terms of Service)
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          تحدد هذه الوثيقة القواعد والشروط التي تحكم وصولك واستخدامك لمنصة أخبار نوعية (naweayh.xyz). استخدامك للموقع يُعد موافقة صريحة على هذه الشروط.
        </p>
      </header>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            1. الملكية الفكرية ونسب المصادر (Fair Use)
          </h2>
          <p className="mb-2">
            تحترم منصة أخبار نوعية حقوق الملكية الفكرية لجميع وكالات الأنباء والصحف الشريكة. يتم نشر الملخصات الإخبارية استناداً إلى مبدأ الاستخدام العادل للأغراض الإخبارية مع ذكر المصدر الأصلي بوضوح ووضع رابط مباشر إليه.
          </p>
          <p>
            العلامات التجارية والتصميمات الخاصة بالمنصة محمية بموجب قوانين الملكية الفكرية، ولا يجوز إعادة إنتاجها لأغراض تجارية دون إذن خطي مسبق.
          </p>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            2. الاستخدام المقبول للمنصة
          </h2>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <li>يُسمح بتصفح ومشاركة الروابط الإخبارية عبر المنصات الاجتماعية والبريد الإلكتروني لأغراض الاطلاع الشخصي ونشر المعرفة.</li>
            <li>يُحظر استخدام أي أدوات كشط آلي عدوانية (Aggressive Web Scraping) تؤثر على أداء الخوادم أو تنتهك ملف robots.txt.</li>
            <li>يُحظر محاولة اختراق أو تعطيل أي جزء من النظام الأمني للمنصة أو واجهات البرمجة (APIs).</li>
          </ul>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-500" />
            3. إخلاء المسؤولية القانونية
          </h2>
          <p>
            تبذل المنصة أقصى درجات العناية المهنية لضمان دقة وتحديث الأخبار. ومع ذلك، فإن المواد الإخبارية المنقولة عن مصادر خارجية تعبر عن وجهة نظر تلك المصادر. لا تتحمل المنصة أي مسؤولية عن أي قرارات استثمارية أو تصرفات يتخذها القارئ بناءً على التحليلات الإخبارية.
          </p>
        </section>
      </div>
    </div>
  );
};
