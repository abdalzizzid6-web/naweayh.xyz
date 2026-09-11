import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EnterpriseUser, AuditLog } from '../../../repositories/enterpriseAdminRepository';
import {
  Shield,
  Key,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Server,
  UserCheck,
} from 'lucide-react';

interface UsersAndRBACCenterProps {
  users: EnterpriseUser[];
  auditLogs: AuditLog[];
  activeSubTab?: 'USERS' | 'ROLES' | 'LOGS';
  onAddUser?: (user: Omit<EnterpriseUser, 'id'>) => void;
  triggerToast: (msg: string) => void;
}

export const UsersAndRBACCenter: React.FC<UsersAndRBACCenterProps> = ({
  users,
  auditLogs,
  triggerToast,
}) => {
  const adminAccount = users[0] || {
    id: '1',
    name: 'مدير النظام الوحيد',
    email: 'admin@naweayh.xyz',
    role: 'مدير النظام',
    status: 'Active',
    lastLogin: 'الجلسة الحالية',
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">مركز أمان مدير النظام الوحيد</h3>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  نظام مبسط محمي
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                تم إلغاء مصفوفات الأدوار المتعددة (RBAC) وتشغيل لوحة التحكم بحساب إدارة مركزي وحيد ومحمي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-slate-400">حالة الجلسة:</span>
            <Badge variant="emerald">نشطة ومحمية بـ JWT</Badge>
          </div>
        </div>
      </div>

      {/* Admin Account Specifications Card */}
      <Card
        title="معلومات حساب مدير النظام الوحيد"
        subtitle="المواصفات الأمنية لحساب الإدارة المعتمد في المنظومة"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Identity Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">البريد الإلكتروني المعتمد</span>
              <UserCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-sm font-black text-slate-900 font-mono dir-ltr text-right">
              {adminAccount.email}
            </p>
            <p className="text-[11px] text-slate-500">
              يتم تحديده وتغييره عبر متغير البيئة <code className="text-indigo-600 font-mono font-bold">ADMIN_EMAIL</code>
            </p>
          </div>

          {/* Password Security Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">تشفير كلمة المرور</span>
              <Lock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900">Bcrypt (12 Rounds)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[11px] text-slate-500">
              مشفرة بالكامل في قاعدة البيانات، ويتم تهيئتها عبر <code className="text-indigo-600 font-mono font-bold">ADMIN_INITIAL_PASSWORD</code>
            </p>
          </div>

          {/* Rate Limiting Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">حماية محاولات التخمين</span>
              <Key className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900">Anti-Brute-Force</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                نشط
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              تجميد تلقائي لمدة 15 دقيقة بعد 5 محاولات تسجيل دخول خاطئة متتالية
            </p>
          </div>
        </div>

        {/* Security Principles List */}
        <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
          <h4 className="text-xs font-bold text-indigo-400 mb-3 flex items-center gap-2">
            <Server className="w-4 h-4" />
            <span>قواعد الحماية الإدارية المطبقة في الخادم</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>كافة مسارات الـ API الإدارية (تعديل المصادر، الجلب، الحذف) تتطلب رمز Bearer JWT موثوق.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>لا توجد أي أسرار أو كلمات مرور مكشوفة داخل كود الواجهة الأمامية.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>تم إيقاف وحذف واجهات إضافة مستخدمين متعددين أو تقسيم الصلاحيات لمنع التشتيت.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>انتهاء تلقائي للجلسة عند الخروج أو تجاوز 24 ساعة لضمان أقصى درجات الأمان.</span>
            </div>
          </div>
        </div>
      </Card>

      {/* AUDIT LOGS */}
      <Card
        title="سجلات التدقيق والأمان الحية (Audit Trail)"
        subtitle="توثيق زمني فوري لكافة العمليات الإدارية وأحداث النظام"
      >
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">المستخدم</th>
                <th className="p-3">الإجراء المنفذ</th>
                <th className="p-3">الكيان المتأثر</th>
                <th className="p-3">الوقت</th>
                <th className="p-3">حالة العملية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans">
                    <span className="font-bold text-slate-900 block">{log.user}</span>
                    <span className="text-[10px] text-indigo-600">{log.role}</span>
                  </td>
                  <td className="p-3 font-sans font-bold text-slate-800">{log.action}</td>
                  <td className="p-3 font-sans text-slate-600">{log.entity}</td>
                  <td className="p-3 text-slate-500">{log.timestamp}</td>
                  <td className="p-3 font-sans">
                    <Badge variant={log.status === 'Success' ? 'emerald' : 'amber'}>{log.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
