import React, { useState } from 'react';
import { Mail, MapPin, Send, CheckCircle2, ArrowRight, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import { SEOHead } from '../../seo-engine/SEOHead';

interface ContactPageProps {
  onNavigateHome: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateHome }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'editorial',
    subject: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', department: 'editorial', subject: '', message: '' });
    }, 600);
  };

  return (
    <div dir="rtl" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans text-slate-800 dark:text-slate-100">
      <SEOHead staticPage="contact" />
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>
        <span className="text-xs text-slate-500">غرفة الأخبار وهيئة التحرير — naweayh.xyz</span>
      </div>

      <header className="mb-10">
        <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-700 dark:text-emerald-400 mb-3">
          <Mail className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          اتصل بنا وتواصل مع هيئة التحرير
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          يسعدنا استقبال استفساراتكم، مقترحاتكم، وبياناتكم الصحفية، وبلاغات تصحيح الأخبار عبر قنوات الاتصال الرسمية لمنصة أخبار نوعية.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold mb-2">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">هيئة التحرير والتصحيح</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">للإبلاغ عن تصحيح خبر أو بيانات صحفية</p>
          <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400" dir="ltr">editor@naweayh.xyz</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">الخصوصية والاستفسارات العامة</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">لشؤون حماية البيانات والاستفسارات العامة</p>
          <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400" dir="ltr">contact@naweayh.xyz</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">سرعة الاستجابة</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">الرد خلال 24 إلى 48 ساعة كحد أقصى</p>
          <p className="text-xs text-slate-400 font-mono">طوال أيام الأسبوع</p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-600" />
          إرسال رسالة مباشرة إلى غرفة الأخبار
        </h2>

        {isSubmitted ? (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">تم استلام رسالتك بنجاح</h3>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
              شكراً لتواصلك مع منصة أخبار نوعية. سيقوم المحرر المسؤول بمراجعة رسالتك والتواصل معك عبر البريد الإلكتروني المرفق خلال 24 ساعة.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 underline"
            >
              إرسال رسالة أخرى
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أحمد عبد الله"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">القسم المعني</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="editorial">هيئة التحرير وتصحيح الأخبار</option>
                  <option value="press">بيان صحفي أو تغطية خاصة</option>
                  <option value="technical">ملاحظات تقنية وأداء الموقع</option>
                  <option value="advertising">استفسار تجاري أو رعاية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">موضوع الرسالة</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="عنوان مختصر للرسالة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نص الرسالة أو تفاصيل الخبر</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="يرجى كتابة التفاصيل بدقة مع ذكر رابط الخبر إن وجد..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors shadow-xs"
            >
              {isSending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
