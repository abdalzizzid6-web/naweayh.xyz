import React from 'react';
import { Cookie, ArrowRight, ShieldCheck, Settings, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../../seo-engine/SEOHead';

interface CookiePolicyPageProps {
  onNavigateHome: () => void;
}

export const CookiePolicyPage: React.FC<CookiePolicyPageProps> = ({ onNavigateHome }) => {
  return (
    <div dir="rtl" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans text-slate-800 dark:text-slate-100">
      <SEOHead staticPage="cookies" />
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>
        <span className="text-xs text-slate-500">آخر تحديث: سبتمبر 2026 — naweayh.xyz</span>
      </div>

      <header className="mb-8">
        <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-700 dark:text-emerald-400 mb-3">
          <Cookie className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          سياسة ملفات تعريف الارتباط (Cookie Policy)
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          توضح هذه الوثيقة كيفية استخدام منصة أخبار نوعية (naweayh.xyz) لملفات تعريف الارتباط والتقنيات المشابهة لتقديم تجربة إخبارية سريعة، مخصصة، وآمنة.
        </p>
      </header>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            1. ما هي ملفات تعريف الارتباط؟
          </h2>
          <p>
            ملفات تعريف الارتباط (Cookies) هي ملفات نصية صغيرة تُخزن على جهازك أو هاتفك عند زيارة صفحات الويب. تساعد هذه الملفات المنصة في تذكر تفضيلاتك (مثل الوضع الليلي/النهاري، حجم الخط، والمقالات المحفوظة) دون جمع أي معلومات شخصية حساسة.
          </p>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            2. أنواع ملفات تعريف الارتباط التي نستخدمها
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">أ. ملفات تعريف الارتباط الأساسية والتقنية (Essential Cookies):</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                ضرورية لتشغيل الموقع بشكل سليم، وتمكين التنقل، وتأمين الجلسات، وحفظ تفضيل الموافقة على الخصوصية. لا يمكن تعطيل هذه الملفات دون تأثر وظائف الموقع.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">ب. ملفات التحليل وقياس الأداء (Analytics Cookies):</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                تساعدنا في فهم كيفية تفاعل القراء مع المقالات والأقسام، وحساب عدد الزيارات ومصادر الحركة بهدف تحسين السرعة وجودة التغطية الصحفية.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">ج. ملفات تعريف الارتباط الإعلانية (Advertising & Google AdSense):</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                يستخدم شركاؤنا الخارجيون، بما في ذلك Google، ملفات تعريف الارتباط (مثل كوكيز DoubleClick) لعرض إعلانات ملائمة للمستخدمين استناداً إلى زياراتهم السابقة لموقعنا أو مواقع أخرى على الإنترنت.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            3. كيفية التحكم في ملفات تعريف الارتباط
          </h2>
          <p className="mb-3">
            يمكنك في أي وقت تعديل تفضيلات متصفحك لقبول أو رفض ملفات تعريف الارتباط، أو حذف الملفات المخزنة بالفعل. كما يمكنك إلغاء الاشتراك في الإعلانات المخصصة عبر إعدادات إعلانات Google الرسمية على الرابط:{' '}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 dark:text-emerald-400 font-bold underline"
            >
              adssettings.google.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
};
