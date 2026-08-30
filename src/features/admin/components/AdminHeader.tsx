import React, { useState } from 'react';
import { Search, Bell, Shield, UserCheck, Sparkles, Command, Sun, Moon, Zap, Activity } from 'lucide-react';
import { UserRole } from '../../../types';
import { Badge } from '../../../components/ui/Badge';

interface AdminHeaderProps {
  currentUser: { name: string; role: UserRole };
  onRoleChange: (role: UserRole) => void;
  onOpenCommandPalette: () => void;
  activeSectionName: string;
  onQuickAction: (action: string) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentUser,
  onRoleChange,
  onOpenCommandPalette,
  activeSectionName,
  onQuickAction,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'خبر عاجل جديد', message: 'تم تحويل خبر قمة الذكاء الاصطناعي إلى عاجل', time: 'منذ دقيقتين', unread: true },
    { id: 'n2', title: 'ملاحظة مصدر', message: 'وكالة الأنباء اليمنية سبأ استجابت خلال 120ms', time: 'منذ 5 دقائق', unread: true },
    { id: 'n3', title: 'مهمة AI مكتملة', message: 'تم التلخيص واستخراج الكيانات لـ 15 مقالاً', time: 'منذ 12 دقيقة', unread: false },
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header dir="rtl" className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left / Section Title & System Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300">Naw3iya Admin</span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-slate-800" />

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">القسم الحالي:</span>
            <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              {activeSectionName}
            </span>
          </div>
        </div>

        {/* Center / Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex-1 max-w-md hidden md:flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-slate-400 text-xs transition-all"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>البحث السريع والتنقل في النظام الإداري...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-1 bg-slate-900 px-2 py-0.5 text-[10px] rounded font-mono text-slate-400 border border-slate-700">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* Right / Actions & Role Selector */}
        <div className="flex items-center gap-3">
          {/* Mobile Command Palette Button */}
          <button
            onClick={onOpenCommandPalette}
            className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-xl border border-slate-800"
            title="البحث السريع"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Actions Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all">
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إجراء سريع</span>
            </button>
            <div className="absolute left-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 hidden group-hover:block z-50 text-xs">
              <button
                onClick={() => onQuickAction('NEW_ARTICLE')}
                className="w-full text-right px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white flex items-center justify-between"
              >
                <span>إضافة خبر جديد</span>
                <span className="text-[10px] text-indigo-400 font-mono">+Article</span>
              </button>
              <button
                onClick={() => onQuickAction('TEST_SOURCE')}
                className="w-full text-right px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white flex items-center justify-between"
              >
                <span>اختبار مصدر RSS/API</span>
                <span className="text-[10px] text-emerald-400 font-mono">Test</span>
              </button>
              <button
                onClick={() => onQuickAction('BREAKING_NEWS')}
                className="w-full text-right px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white flex items-center justify-between"
              >
                <span>إعلان خبر عاجل</span>
                <span className="text-[10px] text-rose-400 font-mono">Breaking</span>
              </button>
            </div>
          </div>

          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-300 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">إشعارات النظام اللحظية</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[10px] text-indigo-400 hover:underline font-semibold">
                      تحديد الكل كتمت قراءته
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border text-xs transition-colors ${
                        n.unread ? 'bg-indigo-950/40 border-indigo-800/50' : 'bg-slate-800/50 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white mb-0.5">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700/80 flex items-center gap-3 pr-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white">{currentUser?.name || 'Admin'}</span>
                <span className="text-[9px] text-indigo-300">{currentUser?.role || 'System Admin'}</span>
              </div>
            </div>
            <div className="w-px h-5 bg-slate-700"></div>
            <button
              onClick={() => {
                import('../../../services/AuthService').then(({ AuthService }) => {
                  AuthService.clearToken();
                  window.location.reload();
                });
              }}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded transition-colors"
            >
              خروج
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
