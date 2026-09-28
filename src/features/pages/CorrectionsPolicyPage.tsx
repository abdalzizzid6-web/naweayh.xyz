import React from 'react';
import { RefreshCw, ArrowRight, ShieldCheck, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { SEOHead } from '../../seo-engine/SEOHead';

interface CorrectionsPolicyPageProps {
  onNavigateHome: () => void;
}

export const CorrectionsPolicyPage: React.FC<CorrectionsPolicyPageProps> = ({ onNavigateHome }) => {
  return (
    <div dir="rtl" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans text-slate-800 dark:text-slate-100">
      <SEOHead staticPage="corrections" />
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>
        <span className="text-xs text-slate-500">سياسة الشفافية والتصحيح — naweayh.xyz</span>
      </div>

      <header className="mb-8">
        <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-700 dark:text-emerald-400 mb-3">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          سياسة التصحيح والشفافية (Corrections Policy)
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          تلتزم منصة أخبار نوعية (naweayh.xyz) بالدقة التامة والنزاهة الصحفية. إذا تبيّن وجود خطأ واقعي في أي مادة منشورة، نتخذ إجراءات فورية وشفافة لتصحيحه.
        </p>
      </header>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            1. الالتزام بالدقة ومسؤولية النشر
          </h2>
          <p>
            تتبع منصة أخبار نوعية مسار تدقيق صارم يعتمد على المصادر الرسمية ووكالات الأنباء المعتمدة. ومع ذلك، في حال وردت معلومات غير دقيقة أو طرأت تحديثات على مجريات الأحداث، فإننا نتحمل مسؤولية التصحيح السريع دون تأخير وبمنتهى الشفافية أمام جمهور القراء.
          </p>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-600" />
            2. كيفية معالجة وتوثيق التصحيحات
          </h2>
          <div className="space-y-3">
            <div className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">أ. الأخطاء الجوهرية (Substantive Errors):</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                عند تصحيح خطأ في حقائق الخبر (مثل أرقام، أسماء، تصريحات، أو تسلسل زمني)، نضع ملحوظة واضحة في أسفل المقال تشير إلى ما تم تعديله وسبب التعديل، مع تحديث تاريخ التعديل (<span className="font-mono text-emerald-600">dateModified</span>) في البيانات المنظمة لـ Google.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">ب. الأخطاء المطبعية واللغوية:</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                يتم تصحيح الأخطاء الإملائية أو النحوية البسيطة التي لا تغير معنى الخبر مباشرة دون الحاجة إلى وضع تنويه تصحيحي خاص.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            3. كيفية الإبلاغ عن خطأ أو طلب تصحيح
          </h2>
          <p className="mb-3">
            نرحب ونشجع قراءنا والمؤسسات المعنية على إبلاغنا بأي معلومة غير دقيقة فور ملاحظتها. يرجى إرسال رسالة إلى هيئة التحرير عبر البريد الإلكتروني:
          </p>
          <div className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 block">بريد طلبات التصحيح والتدقيق:</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono" dir="ltr">
                editor@naweayh.xyz
              </span>
            </div>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full font-bold">
              استجابة خلال 24 ساعة
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
