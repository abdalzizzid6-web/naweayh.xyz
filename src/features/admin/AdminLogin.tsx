import React, { useState } from 'react';
import { Shield, KeyRound, User, Loader2 } from 'lucide-react';
import { AuthService } from '../../services/AuthService';
import { useApp } from '../../presentation/context/AppContext';

export const AdminLogin: React.FC = () => {
  const { setCurrentUser } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        body: JSON.stringify({ email: username.trim(), password })
      });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data.success) {
        AuthService.setToken(data.token);
        setCurrentUser({
          id: data.user.id.toString(),
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          department: 'غرفة الأخبار — OmniNews'
        });
      } else {
        setError(data.message || 'فشل تسجيل الدخول: يرجى التحقق من صحة البيانات');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-['Cairo',sans-serif]" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-900/50">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">نظام الإدارة المركزية</h1>
          <p className="text-slate-400 mt-2 text-lg">OmniNews Enterprise</p>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">اسم المستخدم أو البريد</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="admin@naweayh.xyz"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">كلمة المرور</label>
              <div className="relative">
                <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
