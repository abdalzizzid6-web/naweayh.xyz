import React, { useState } from 'react';
import { Shield, KeyRound, Mail, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { AuthService } from '../../services/AuthService';
import { useApp } from '../../presentation/context/AppContext';

export const AdminLogin: React.FC = () => {
  const { setCurrentUser, setActiveTab, navigate } = useApp();
  const [email, setEmail] = useState('admin@naweayh.xyz');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data.success) {
        AuthService.setToken(data.token);
        setCurrentUser({
          id: data.user.id.toString(),
          name: data.user.name || 'مدير النظام',
          email: data.user.email,
          role: 'admin' as any,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          department: 'إدارة النظام والتحرير'
        });
        setActiveTab('admin');
        navigate('/admin');
      } else {
        setError(data.message || 'فشل تسجيل الدخول: يرجى التحقق من صحة البريد وكلمة المرور');
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بالخادم. يرجى التحقق من اتصال الشبكة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-['Cairo',sans-serif]" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-700 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-900/40 ring-1 ring-indigo-400/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">تسجيل دخول مدير النظام</h1>
          <p className="text-slate-400 mt-1.5 text-sm font-medium">لوحة التحكم المركزية — أخبار نوعية</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-300 ml-1 block">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-4 pr-11 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="admin@naweayh.xyz"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-300 ml-1 block">
                كلمة المرور
              </label>
              <div className="relative">
                <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-4 pr-11 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 shadow-lg shadow-indigo-900/30 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <span>دخول إلى لوحة التحكم</span>
              )}
            </button>
          </form>

          {/* Quick Credential Helper */}
          <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
            <span className="text-slate-500">بيانات دخول المدير الافتراضية:</span>
            <div className="mt-1 font-mono text-indigo-400 font-bold flex items-center justify-center gap-3">
              <span>admin@naweayh.xyz</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">admin123</span>
            </div>
          </div>

          {/* Return to Portal */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setActiveTab('portal');
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
            >
              <span>العودة إلى موقع الأخبار</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Security Badge */}
        <p className="text-center text-[11px] text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3 text-emerald-500" />
          <span>منطقة إدارة آمنة ومحمية بتشفير JWT و Rate Limiting</span>
        </p>
      </div>
    </div>
  );
};
