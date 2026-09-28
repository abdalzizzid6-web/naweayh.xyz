import React from 'react';
import { Newspaper, ArrowRight, Target, Award, Users, ShieldCheck, Cpu, Globe2, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../../seo-engine/SEOHead';

interface AboutPageProps {
  onNavigateHome: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateHome }) => {
  return (
    <div dir="rtl" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans text-slate-800 dark:text-slate-100">
      <SEOHead staticPage="about" />
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>
        <span className="text-xs text-slate-500">من نحن — naweayh.xyz</span>
      </div>

      <header className="mb-10 text-center sm:text-right">
        <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-700 dark:text-emerald-400 mb-3">
          <Newspaper className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          عن منصة أخبار نوعية (Naw3iya News)
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
          المنصة الإخبارية الرقمية المتخصصة في تقديم تغطية صحفية نوعية، عميقة، وموثقة، ترتكز على مكافحة التضليل الإعلامي وتقديم الخبر اليقين للقارئ العربي.
        </p>
      </header>

      <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        {/* Mission Section */}
        <section className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            رسالتنا وأهدافنا التحريرية
          </h2>
          <p className="mb-3">
            انطلقت منصة <strong>«أخبار نوعية»</strong> كاستجابة موضوعية لحالة التشبع والضجيج الإخباري في الفضاء الرقمي العربي، حيث تتكرر الأخبار دون تدقيق وتختلط الشائعات بالحقائق.
          </p>
          <p>
            تتمثل رسالتنا في غربلة وتدقيق آلاف المواد الإخبارية اليومية الواردة من أكثر من 45 وكالة وصحيفة معتمدة، وتقديم الخبر الموثق بدقة وإيجاز، مع احترام كامل لحقوق الملكية الفكرية وشفافية المصادر.
          </p>
        </section>

        {/* Pillars Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-3 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">المصداقية والتحقق (E-E-A-T)</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              لا نعتمد على الإثارة أو العناوين المضللة (Clickbait). كل خبر يخضع للتحقق من المصدر الأصلي مع الإشارة للرابط وتوقيت النشر بالساعة والدقيقة.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-3 font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">الذكاء التحريري والتقني</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              نوظف أحدث خوارزميات تجميع القصة الإخبارية (Story Clustering) لمنح القارئ زوايا التغطية المختلفة للحدث الواحد من مصادر متعددة في صفحة واحدة.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-3 font-bold">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">تغطية محلية وعالمية متوازنة</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              اهتمام خاص بالشأن اليمني والخليجي والعربي، إلى جانب مواكبة فورية لأبرز تطورات السياسة، الاقتصاد، والتقنية العالمية.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-3 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">فريق الإدارة والتحرير</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              يُشرف على المنصة فريق صحفي وتقني متخصص في الصحافة الرقمية وسلامة البيانات لضمان استمرارية الخدمة وتطوير التجربة.
            </p>
          </div>
        </section>

        {/* Commitment */}
        <section className="bg-emerald-50 dark:bg-emerald-950/40 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800">
          <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            التزامنا تجاه القارئ
          </h2>
          <p className="text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm leading-relaxed">
            نلتزم بأن تبقى منصة أخبار نوعية بيئة إخبارية نظيفة، خالية من النوافذ المزعجة والإعلانات المضللة، وسريعة التصفح على الهواتف والأجهزة المكتبية، بما يخدم الباحثين عن المعرفة الصحفية الرصينة.
          </p>
        </section>
      </div>
    </div>
  );
};
