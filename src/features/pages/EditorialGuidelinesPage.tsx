import React from 'react';
import { BookOpen, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Zap, FileText, Ban } from 'lucide-react';
import { SEOHead } from '../../seo-engine/SEOHead';

interface EditorialGuidelinesPageProps {
  onNavigateHome: () => void;
}

export const EditorialGuidelinesPage: React.FC<EditorialGuidelinesPageProps> = ({ onNavigateHome }) => {
  return (
    <div dir="rtl" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans text-slate-800 dark:text-slate-100">
      <SEOHead staticPage="editorial" />
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>
        <span className="text-xs text-slate-500">معايير النشر والتدقيق (E-E-A-T) — naweayh.xyz</span>
      </div>

      <header className="mb-8">
        <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-700 dark:text-emerald-400 mb-3">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          السياسة التحريرية ومعايير النزاهة الصحفية
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          تعتمد منصة أخبار نوعية (naweayh.xyz) ميثاق شرف مهني صارم متوافق مع معايير Google للصحافة الرقمية (Google News Content Policies) لضمان الدقة، الشفافية، ومكافحة التضليل الإعلامي.
        </p>
      </header>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        {/* 1. التحقق من الأخبار */}
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            1. منهجية التحقق من الأخبار (Fact-Checking)
          </h2>
          <p>
            تخضع كل مادة خبرية لعملية تدقيق متعددة المستويات قبل العرض. يتم فحص الوقائع، التواريخ، والأسماء بمقارنتها مع البيانات الرسمية. في حال وجود ادعاءات متضاربة أو معلومات غير مؤكدة، نوضح ذلك صراحة للقراء أو نحجب نشر المادة حتى ثبوت مصداقيتها من وكالات الأنباء الرسمية.
          </p>
        </section>

        {/* 2. مصادر الأخبار المعتمدة */}
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            2. مصادر الأخبار ومعايير اختيارها
          </h2>
          <p className="mb-2">
            تعتمد منصتنا دليلاً يضم أكثر من 45 مصدراً إخبارياً معتمداً يشمل وكالات الأنباء الوطنية (مثل وكالة الأنباء اليمنية سبأ، وكالة الأنباء السعودية واس، رويترز، وفرانس برس) والصحف الموثوقة ذات السمعة المهنية الراسخة.
          </p>
          <p>
            لا نعتمد على الحسابات المجهولة في منصات التواصل الاجتماعي كمصادر خبرية أساسية دون تأكيد رسمي موثق.
          </p>
        </section>

        {/* 3. التعامل مع الأخبار العاجلة */}
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            3. بروتوكول التعامل مع الأخبار العاجلة (Breaking News)
          </h2>
          <p>
            تتطلب الأخبار العاجلة سرعة في النقل ودقة بالغة في الآن ذاته. نلتزم بالقواعد التالية:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>عدم التسرع في نشر أنباء عاجلة تستند إلى مصدر واحد غير معلن.</li>
            <li>تمييز الأخبار المتطورة بعبارة «خبر متطور / قيد التحديث» وتوضيح آخر توقيت تم فيه تعديل المادة.</li>
            <li>الامتناع عن نشر الشائعات أو التكهنات خلال الأزمات والكوارث.</li>
          </ul>
        </section>

        {/* 4. الفرق بين المحتوى الكامل والمقتطف */}
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            4. التمييز بين المحتوى الأصلي والموجز المرخص (Excerpts & Attribution)
          </h2>
          <p className="mb-2">
            احتراماً لحقوق الملكية الفكرية وجهود الصحفيين، تفرّق منصة أخبار نوعية بين نوعين من المواد:
          </p>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <strong className="text-slate-900 dark:text-white block mb-0.5">أ. التقارير والتحليلات الخاصة بالمنصة:</strong>
              مواد أصيلة أعدها فريق التحرير بناءً على مصادر موثقة وتغطيات حصرية.
            </div>
            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <strong className="text-slate-900 dark:text-white block mb-0.5">ب. الملخصات والموجزات المقتبسة من مصادر شريكة:</strong>
              مواد إخبارية يتم تلخيص جوهرها بأسلوب مهني مع إبراز اسم المصدر الأصلي بوضوح ووضع رابط مباشر وكامل للمقال في موقعه الأصلي. لا ندعي ملكية المقالات الكاملة المنشورة لدى شركائنا.
            </div>
          </div>
        </section>

        {/* 5. حظر اختلاق الأخبار والذكاء الاصطناعي المسؤول */}
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-600" />
            5. حظر اختلاق الأخبار وضوابط الذكاء الاصطناعي
          </h2>
          <p className="mb-2">
            نحظر تماماً أي شكل من أشكال اختلاق الأخبار أو توليد نصوص وهمية. يُستخدم الذكاء الاصطناعي في المنصة حصرياً كأداة مساعدة للمساعدة في تصنيف البيانات، استخراج الكلمات المفتاحية، ومقارنة التغطيات المتعددة لنفس الحدث (Story Clustering).
          </p>
          <p>
            كل معلومة أو تصريح يُنشر على المنصة يجب أن يكون منسوباً إلى مصدر حقيقي موثوق، ولا يُسمح لنماذج الذكاء الاصطناعي بتوليد حقائق من العدم (Zero Hallucination Policy).
          </p>
        </section>

        {/* 6. تصحيح الأخطاء */}
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            6. التزام تصحيح الأخطاء
          </h2>
          <p>
            تتبع المنصة سياسة تصحيح سريعة وشفافة. للمزيد حول آليات التصحيح وتقديم البلاغات، يرجى زيارة صفحة{' '}
            <a href="/corrections" className="text-emerald-700 dark:text-emerald-400 font-bold underline">
              سياسة التصحيح والشفافية
            </a>{' '}
            أو مراسلتنا مباشرة على <span className="font-mono text-emerald-600 font-bold" dir="ltr">editor@naweayh.xyz</span>.
          </p>
        </section>
      </div>
    </div>
  );
};
