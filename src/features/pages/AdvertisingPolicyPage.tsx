import React from 'react';
import { Megaphone, ArrowRight, ShieldCheck, CheckCircle2, DollarSign, Ban } from 'lucide-react';
import { SEOHead } from '../../seo-engine/SEOHead';

interface AdvertisingPolicyPageProps {
  onNavigateHome: () => void;
}

export const AdvertisingPolicyPage: React.FC<AdvertisingPolicyPageProps> = ({ onNavigateHome }) => {
  return (
    <div dir="rtl" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans text-slate-800 dark:text-slate-100">
      <SEOHead staticPage="advertising" />
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>
        <span className="text-xs text-slate-500">سياسة الإعلانات والتسويق — naweayh.xyz</span>
      </div>

      <header className="mb-8">
        <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-700 dark:text-emerald-400 mb-3">
          <Megaphone className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          سياسة الإعلانات والرعاية (Advertising Policy)
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          تحدد هذه السياسة المبادئ التي تحكم نشر الإعلانات والمحتوى الترويجي على منصة أخبار نوعية (naweayh.xyz) لضمان الفصل التام بين العمل الصحفي التحريري والمساحات الإعلانية التجارية.
        </p>
      </header>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            1. الفصل المطلق بين التحرير والإعلان
          </h2>
          <p>
            تتمتع هيئة التحرير في منصة أخبار نوعية باستقلالية صحفية كاملة. لا يمارس المعلنون أو الرعاة أي تأثير على القرارات التحريرية، أو اختيار الأخبار، أو طريقة تغطية الأحداث والقضايا العامة.
          </p>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            2. الشفافية والتمييز البصري
          </h2>
          <p className="mb-3">
            يتم تمييز جميع المساحات الإعلانية بوضوح تام عبر تسميات صريحة مثل <span className="font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">إعلان</span> أو <span className="font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">محتوى مدعوم</span>.
          </p>
          <p>
            لا نسمح بنشر أي إعلانات خادعة تحاكي شكل الأخبار الصحفية أو تقارير المنصة المستقلة بهدف تضليل القارئ أو إيقاعه في نقرات غير مقصودة.
          </p>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-600" />
            3. المحتوى الإعلاني المحظور
          </h2>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>الإعلانات المضللة، الاحتيالية، أو الوعود المالية غير الواقعية.</li>
            <li>الإعلانات ذات النوافذ المنبثقة المزعجة (Pop-ups) أو التي تجبر المستخدم على النقر.</li>
            <li>الإعلانات التي تروج للأسلحة أو المواد المحظورة أو الكراهية والتمييز.</li>
            <li>الإعلانات التي تنتهك معايير Better Ads Standards وسياسات Google AdSense.</li>
          </ul>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            4. شبكات الإعلانات البرمجية (Programmatic Advertising)
          </h2>
          <p>
            تتعامل المنصة مع شبكات إعلانية رسمية معتمدة ومسجلة في ملف <span className="font-mono text-emerald-600 font-bold">/ads.txt</span> مثل Google AdSense، والتي تطبق معايير تدقيق آلي مستمر لضمان سلامة الإعلانات وحماية خصوصية المستخدمين.
          </p>
        </section>
      </div>
    </div>
  );
};
