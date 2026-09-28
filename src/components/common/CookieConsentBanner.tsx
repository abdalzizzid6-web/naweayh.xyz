import React, { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck } from 'lucide-react';
import { useApp } from '../../presentation/context/AppContext';

export const CookieConsentBanner: React.FC = () => {
  const { navigate } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('naweayh_cookie_consent');
      if (!consent) {
        // Show after a gentle 1 second delay
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('naweayh_cookie_consent', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    } catch {}
    setIsVisible(false);
  };

  const handleDeclineNonEssential = () => {
    try {
      localStorage.setItem('naweayh_cookie_consent', JSON.stringify({ accepted: false, essentialOnly: true, date: new Date().toISOString() }));
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="إشعار ملفات تعريف الارتباط"
      dir="rtl"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-5 font-sans transition-all animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
            <span>ملفات تعريف الارتباط والخصوصية</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح، وتحليل حركة الزوار، وتقديم محتوى وإعلانات نوعية مخصصة وفقاً لـ{' '}
            <button
              onClick={() => navigate('/privacy-policy')}
              className="text-emerald-700 dark:text-emerald-400 font-bold underline hover:opacity-80"
            >
              سياسة الخصوصية
            </button>{' '}
            و{' '}
            <button
              onClick={() => navigate('/cookie-policy')}
              className="text-emerald-700 dark:text-emerald-400 font-bold underline hover:opacity-80"
            >
              سياسة الكوكيز
            </button>
            .
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
        <button
          onClick={handleDeclineNonEssential}
          className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
        >
          الأساسية فقط
        </button>
        <button
          onClick={handleAcceptAll}
          className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors shadow-xs"
        >
          موافق على الكل
        </button>
      </div>
    </aside>
  );
};
