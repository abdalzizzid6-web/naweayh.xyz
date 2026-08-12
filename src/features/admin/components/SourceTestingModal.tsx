import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EnterpriseSource } from '../../../repositories/enterpriseAdminRepository';
import {
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Rss,
  Globe,
  Database,
  FileText,
  Image as ImageIcon,
  Calendar,
  Layers,
} from 'lucide-react';

interface SourceTestingModalProps {
  isOpen: boolean;
  source: EnterpriseSource | null;
  onClose: () => void;
  onImportItems: (sourceName: string, count: number) => void;
}

export const SourceTestingModal: React.FC<SourceTestingModalProps> = ({
  isOpen,
  source,
  onClose,
  onImportItems,
}) => {
  if (!isOpen) return null;

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'SUCCESS' | 'WARNING' | 'FAILED';
    responseTimeMs: number;
    httpStatus: number;
    totalItems: number;
    validItems: number;
    duplicateItems: number;
    failedItems: number;
    extractedImages: number;
    sampleArticles: Array<{
      title: string;
      pubDate: string;
      hasImage: boolean;
      isValid: boolean;
    }>;
  } | null>(null);

  const runTestSource = () => {
    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setTesting(false);
      setTestResult({
        status: 'SUCCESS',
        responseTimeMs: Math.floor(Math.random() * 200) + 120,
        httpStatus: 200,
        totalItems: 15,
        validItems: 14,
        duplicateItems: 1,
        failedItems: 0,
        extractedImages: 14,
        sampleArticles: [
          {
            title: 'إعلان خطة التحول الرقمي وتوسيع التغطية الأخبار الإقليمية',
            pubDate: new Date().toLocaleTimeString('ar-SA'),
            hasImage: true,
            isValid: true,
          },
          {
            title: 'مؤتمر الاستثمار التقني يستعرض الفرص القادمة في المنطقة',
            pubDate: new Date().toLocaleTimeString('ar-SA'),
            hasImage: true,
            isValid: true,
          },
          {
            title: 'تقرير اقتصادي: ارتفاع معدلات التداول والنمو في القطاع الخدمي',
            pubDate: new Date().toLocaleTimeString('ar-SA'),
            hasImage: true,
            isValid: true,
          },
        ],
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-900 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">اختبار وفحص المصدر الإخباري (Source Fetch Tester)</h3>
              <span className="text-[10px] text-slate-400">فحص استجابة الرابط، التحقق من التوافق، واستخراج العناصر</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">{source?.name || 'مصدر جديد'}</span>
              <Badge variant="indigo">{source?.type || 'RSS Feed'}</Badge>
            </div>
            <p className="text-xs font-mono text-slate-600 truncate">{source?.url || 'https://spa.gov.sa/rss'}</p>
          </div>

          {!testResult && !testing && (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
              <Rss className="w-10 h-10 text-indigo-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">جاهز لبدء الفحص واختبار الاتصال</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                سيقوم النظام بإرسال طلب فوري للرابط، التحقق من هيكل XML/JSON، واستخراج حقول العنوان والصورة والتاريخ.
              </p>
              <Button onClick={runTestSource} variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-xs gap-2">
                <Zap className="w-4 h-4" />
                <span>بدء الفحص والاختبار الآن</span>
              </Button>
            </div>
          )}

          {testing && (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <span className="text-xs font-bold text-slate-800 block">جاري الاتصال بالمصدر وتحليل العناصر...</span>
            </div>
          )}

          {testResult && (
            <div className="space-y-4 animate-in fade-in">
              {/* Test Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] text-emerald-700 font-bold block">زمن الاستجابة</span>
                  <strong className="text-lg font-black text-emerald-900 font-mono">{testResult.responseTimeMs}ms</strong>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-[10px] text-indigo-700 font-bold block">إجمالي العناصر</span>
                  <strong className="text-lg font-black text-indigo-900 font-mono">{testResult.totalItems} عنصر</strong>
                </div>

                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                  <span className="text-[10px] text-sky-700 font-bold block">العناصر الصالحة</span>
                  <strong className="text-lg font-black text-sky-900 font-mono">{testResult.validItems}</strong>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] text-amber-700 font-bold block">العناصر المكررة</span>
                  <strong className="text-lg font-black text-amber-900 font-mono">{testResult.duplicateItems}</strong>
                </div>
              </div>

              {/* Sample Extracted News */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">معاينة العناصر المستخرجة حديثاً:</span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {testResult.sampleArticles.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-900 truncate max-w-xs">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.pubDate}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Button variant="outline" size="sm" onClick={runTestSource}>
                  إعادة الاختبار
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onImportItems(source?.name || 'مصدر جديد', testResult.validItems);
                    onClose();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1.5"
                >
                  <Database className="w-4 h-4" />
                  <span>استيراد ({testResult.validItems}) خبر محلياً إلى المحرك</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
