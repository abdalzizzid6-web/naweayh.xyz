import React from 'react';
import { Shield, Lock, FileText, ArrowRight, CheckCircle2, Globe, Eye, Server, Cookie } from 'lucide-react';
import { SEOHead } from '../../seo-engine/SEOHead';

interface PrivacyPolicyPageProps {
  onNavigateHome: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigateHome }) => {
  return (
    <div dir="rtl" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans text-slate-800 dark:text-slate-100">
      <SEOHead staticPage="privacy" />
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
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          سياسة الخصوصية وحماية البيانات (Privacy Policy)
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          في منصة أخبار نوعية (naweayh.xyz)، نضع خصوصية زوارنا وأمان بياناتهم على رأس أولوياتنا. توضح هذه الوثيقة طبيعة المعلومات التي يتم جمعها وكيفية حمايتها واستخدامها بما يتوافق مع المعايير العالمية ومعايير شركائنا الإعلانيين مثل Google AdSense.
        </p>
      </header>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            1. المعلومات التي نجمعها
          </h2>
          <p className="mb-2">
            لا تطلب منصة أخبار نوعية من القراء إنشاء حسابات أو تقديم معلومات شخصية حساسة لتصفح الأخبار العامة. تنحصر البيانات المجمعة في:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            <li><strong>بيانات السجلات (Log Files):</strong> تشمل عناوين بروتوكول الإنترنت (IP)، نوع المتصفح، مزود خدمة الإنترنت (ISP)، صفحات الإحالة والخروج، والتاريخ والوقت، لقياس أداء الخادم ومنع الهجمات الإلكترونية.</li>
            <li><strong>بيانات التفاعل الاختياري:</strong> الاسم والبريد الإلكتروني فقط عند تواصلك الطوعي معنا عبر نموذج «اتصل بنا» أو للإبلاغ عن تصحيح خبر.</li>
          </ul>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Cookie className="w-5 h-5 text-emerald-600" />
            2. ملفات تعريف الارتباط وإعلانات Google AdSense
          </h2>
          <p className="mb-2">
            نستخدم ملفات تعريف الارتباط (Cookies) لتخزين تفضيلات المستخدم (مثل الوضع المظلم)، وتحسين سرعة التصفح.
          </p>
          <div className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-2">
            <p>
              <strong>إفصاح إعلانات Google:</strong> تستخدم Google كطرف ثالث ملفات تعريف الارتباط لعرض الإعلانات على موقعنا. يتيح استخدام Google لملف تعريف الارتباط DART عرض الإعلانات للمستخدمين استناداً إلى زيارتهم لموقعنا ومواقع أخرى على شبكة الإنترنت.
            </p>
            <p>
              يمكن للمستخدمين إلغاء استخدام ملف تعريف الارتباط DART بزيارة سياسة الخصوصية الخاصة بإعلانات Google وشبكة المحتوى على الرابط:{' '}
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 dark:text-emerald-400 font-bold underline"
              >
                policies.google.com/technologies/ads
              </a>
              .
            </p>
          </div>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            3. حماية البيانات وأمن المعلومات
          </h2>
          <p>
            نطبق بروتوكولات تشفير قياسية (HTTPS / SSL/TLS) لحماية البيانات المنقولة بين متصفحك وخوادمنا. كما لا نقوم ببيع أو تأجير أو مشاركة أي بيانات شخصية مع أي جهات تسويقية خارجية تحت أي ظرف.
          </p>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            4. حقوق المستخدم والتواصل
          </h2>
          <p className="mb-2">
            يحق لك في أي وقت الاستفسار عن أي بيانات أو طلب حذف أي مراسلات سابقة قمت بها مع فريق الموقع عبر مراسلة مسؤول حماية البيانات على:
          </p>
          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 inline-block font-mono text-emerald-700 dark:text-emerald-400 font-bold text-sm" dir="ltr">
            privacy@naweayh.xyz
          </div>
        </section>
      </div>
    </div>
  );
};
