import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EnterpriseUser, AuditLog } from '../../../repositories/enterpriseAdminRepository';
import { UserRole } from '../../../types';
import {
  Users,
  UserCheck,
  Shield,
  Plus,
  Key,
  Lock,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface UsersAndRBACCenterProps {
  users: EnterpriseUser[];
  auditLogs: AuditLog[];
  activeSubTab?: 'USERS' | 'ROLES' | 'LOGS';
  onAddUser: (user: Omit<EnterpriseUser, 'id'>) => void;
  triggerToast: (msg: string) => void;
}

export const UsersAndRBACCenter: React.FC<UsersAndRBACCenterProps> = ({
  users,
  auditLogs,
  activeSubTab = 'USERS',
  onAddUser,
  triggerToast,
}) => {
  const [subTab, setSubTab] = useState<'USERS' | 'ROLES' | 'LOGS'>(activeSubTab);
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div dir="rtl" className="space-y-6">
      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">إدارة المستخدمين والصلاحيات وسجلات التدقيق Security Matrix</h3>
          <p className="text-xs text-slate-500 mt-0.5">التحكم في أدوار طاقم العمليات والتفتيش الفوري لسجلات الأمان</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('USERS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'USERS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المستخدمين ({users.length})
          </button>
          <button
            onClick={() => setSubTab('ROLES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'ROLES' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            مصفوفة الصلاحيات (RBAC)
          </button>
          <button
            onClick={() => setSubTab('LOGS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'LOGS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            سجلات التدقيق (Audit Logs)
          </button>
        </div>
      </div>

      {/* USERS LIST */}
      {subTab === 'USERS' && (
        <Card
          title="فريق إدارة المنصة والعمليات الإخبارية"
          subtitle="استعراض حسابات المدراء والمحررين والمشرفين"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث في أسماء المستخدمين والإيميلات..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onAddUser({
                    name: 'عضو فريق جديد',
                    email: `editor-${Date.now().toString().slice(-3)}@naweayh.xyz`,
                    role: 'Operations Lead',
                    status: 'Active',
                    lastLogin: 'الآن',
                  });
                  triggerToast('تم إضافة حساب جديد للطاقم التحريري');
                }}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مستخدم جديد</span>
              </Button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">الاسم والبريد</th>
                    <th className="p-3">الدور الإداري (RBAC Role)</th>
                    <th className="p-3">آخر تسجيل دخول</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{u.email}</span>
                      </td>

                      <td className="p-3">
                        <Badge variant="indigo">{u.role}</Badge>
                      </td>

                      <td className="p-3 font-mono text-slate-600">{u.lastLogin}</td>

                      <td className="p-3">
                        <Badge variant="emerald">نشط</Badge>
                      </td>

                      <td className="p-3">
                        <Button variant="outline" size="xs" onClick={() => triggerToast(`تم تعديل دور ${u.name}`)}>
                          تعديل الدور
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* RBAC MATRIX */}
      {subTab === 'ROLES' && (
        <Card
          title="مصفوفة الأدوار والصلاحيات الأسبوعية (Role-Based Access Control)"
          subtitle="تحديد مستويات التحكم الخاصة بكل دور إداري داخل المنظومة"
        >
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3 text-xs">
            <h4 className="font-bold text-indigo-300">مستويات الصلاحية Server-Side RBAC</h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Executive: صلاحيات كاملة على الأداء والمشاهدة والتقرير</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>System Admin: إدارة المصادر والمستخدمين وإعدادات الخادم</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Operations Lead: إدارة الأخبار والعاجل والنشر الاجتماعي</span>
              </li>
            </ul>
          </div>
        </Card>
      )}

      {/* AUDIT LOGS */}
      {subTab === 'LOGS' && (
        <Card
          title="سجلات الأمان والتدقيق الإداري (Audit Trail)"
          subtitle="تسجيل لحظي لكافة الإجراءات المنفذة داخل لوحة التحكم"
        >
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs font-mono">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 font-sans">
                <tr>
                  <th className="p-3">المستخدم والدور</th>
                  <th className="p-3">الإجراء المنفذ</th>
                  <th className="p-3">الكيان المتأثر</th>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">النتيجة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block font-sans">{log.user}</span>
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
      )}
    </div>
  );
};
