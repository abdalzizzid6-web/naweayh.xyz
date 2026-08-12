import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { NewsArticle } from '../../../core/domain/types';
import {
  GitBranch,
  AlertCircle,
  Clock,
  Send,
  CheckCircle2,
  Bell,
  Share2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface EditorialWorkflowCenterProps {
  articles: NewsArticle[];
  activeSubTab?: 'WORKFLOW' | 'BREAKING' | 'SCHEDULING';
  onToggleBreaking: (articleId: string) => void;
  triggerToast: (msg: string) => void;
}

export const EditorialWorkflowCenter: React.FC<EditorialWorkflowCenterProps> = ({
  articles,
  activeSubTab = 'WORKFLOW',
  onToggleBreaking,
  triggerToast,
}) => {
  const [subTab, setSubTab] = useState<'WORKFLOW' | 'BREAKING' | 'SCHEDULING'>(activeSubTab);
  const [breakingTimerHours, setBreakingTimerHours] = useState('3');
  const [breakingPriority, setBreakingPriority] = useState('High');

  // Filter Breaking Articles
  const breakingArticles = articles.filter((a) => a.isBreaking);

  // Workflow Pipeline Stages
  const stages = [
    { name: '1. المصادر والجلب', count: 42, color: 'border-slate-300 bg-slate-50' },
    { name: '2. توحيد البيانات', count: 38, color: 'border-sky-300 bg-sky-50' },
    { name: '3. منع التكرار', count: 35, color: 'border-indigo-300 bg-indigo-50' },
    { name: '4. معالجة AI', count: 35, color: 'border-purple-300 bg-purple-50' },
    { name: '5. مراجعة التحرير', count: 3, color: 'border-amber-300 bg-amber-50' },
    { name: '6. الاعتماد والنشر', count: articles.length, color: 'border-emerald-300 bg-emerald-50' },
    { name: '7. التوزيع الاجتماعي', count: 18, color: 'border-rose-300 bg-rose-50' },
  ];

  const handlePublishBreakingAlert = (art: NewsArticle) => {
    triggerToast(`🚨 تم إرسال إشعار لحظي (Push Notification) وبث الخبر العاجل: (${art.title.slice(0, 25)}...)`);
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Top Sub-navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">سلسلة اعتماد التحرير والأخبار العاجلة والجدولة</h3>
          <p className="text-xs text-slate-500 mt-0.5">إدارة مراحل معالجة المحتوى، البث اللحظي للخبر العاجل، وجدولة المواعيد</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('WORKFLOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'WORKFLOW' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            مسار التحرير (Pipeline)
          </button>
          <button
            onClick={() => setSubTab('BREAKING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'BREAKING' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الأخبار العاجلة ({breakingArticles.length})
          </button>
          <button
            onClick={() => setSubTab('SCHEDULING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'SCHEDULING' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جدولة النشر
          </button>
        </div>
      </div>

      {/* WORKFLOW PIPELINE */}
      {subTab === 'WORKFLOW' && (
        <Card
          title="خط سير معالجة الخبر من السحب وحتى التوزيع"
          subtitle="رسم بياني للمراحل التي يمر بها المقال داخل النظام"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {stages.map((stg, idx) => (
                <div key={idx} className={`p-3 rounded-xl border ${stg.color} text-center space-y-1 shadow-xs`}>
                  <span className="text-[10px] font-bold text-slate-600 block">{stg.name}</span>
                  <strong className="text-lg font-black text-slate-900 font-mono block">{stg.count}</strong>
                  <span className="text-[9px] text-slate-400 block">عنصر جارٍ</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-400" />
                <h4 className="text-xs font-bold text-white">قواعد الاعتماد والموافقة البشرية (Human in the loop)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                يحتفظ المحرر البشري بالسلطة النهائية لاعتماد المحتوى الملخص تلقائياً أو تعديله أو رفضه قبل النشر على منصات التواصل أو القنوات الرسمية.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* BREAKING NEWS CENTER */}
      {subTab === 'BREAKING' && (
        <Card
          title="مركز غرف العمليات للأخبار العاجلة والطارئة"
          subtitle="بث الأخبار العاجلة، ضبط العداد الزمني، وإرسال الإشعارات اللحظية"
        >
          <div className="space-y-6">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-rose-900 block">إعدادات توقيت وأولوية الشريط العاجل</span>
                <p className="text-[11px] text-rose-700">تطبيق التنبيهات اللحظية ومزامنة شريط الأخبار السفلي</p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div>
                  <span className="text-slate-600 font-bold block mb-1">المدة الزمانية (ساعات)</span>
                  <select
                    value={breakingTimerHours}
                    onChange={(e) => setBreakingTimerHours(e.target.value)}
                    className="p-1.5 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="1">1 ساعة</option>
                    <option value="3">3 ساعات</option>
                    <option value="6">6 ساعات</option>
                    <option value="24">24 ساعة</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-600 font-bold block mb-1">الأولوية</span>
                  <select
                    value={breakingPriority}
                    onChange={(e) => setBreakingPriority(e.target.value)}
                    className="p-1.5 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Emergency">طارئ جداً (Emergency)</option>
                    <option value="High">عالي (High)</option>
                    <option value="Normal">عادي (Normal)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Breaking Articles Table */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block">الأخبار المحددة كـ "عاجل" حالياً ({breakingArticles.length}):</span>
              {breakingArticles.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  لا توجد أخبار عاجلة نشطة حالياً في النظام
                </div>
              ) : (
                breakingArticles.map((art) => (
                  <div key={art.id} className="p-4 bg-white border border-rose-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{art.title}</h4>
                        <span className="text-xs text-slate-500">{art.country} • {art.publishDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handlePublishBreakingAlert(art)}
                        className="bg-rose-600 hover:bg-rose-700 text-xs gap-1.5"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>بث إشعار لحظي (Push)</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          onToggleBreaking(art.id);
                          triggerToast(`تم إلغاء العاجل عن: (${art.title.slice(0, 20)}...)`);
                        }}
                        className="text-slate-600 border-slate-300 hover:bg-slate-100 text-xs"
                      >
                        إلغاء العاجل
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}

      {/* SCHEDULING CENTER */}
      {subTab === 'SCHEDULING' && (
        <Card
          title="جدولة النشر الآلي وتحديد الأوقات المستقبلية"
          subtitle="تجهيز ونشر الأخبار التحريرية بناءً على خريطة المواعيد والمنطقة الزمنية (Asia/Aden)"
        >
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
            <Calendar className="w-10 h-10 text-indigo-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">طابور النشر المجدول نشط وجاهز</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              تتيح لك الميزة تحديد وقت المستقبل لكل خبر. يقوم السيرفر التلقائي بنشر المقال فور حلول التوقيت المحدد دون تدخل بشري.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
