import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { aiEngineService, AIPipelineResult } from '../../services/aiEngineService';
import { Sparkles, Users, Building2, MapPin, Calendar, Tag, CheckCircle2, Loader2, Database, ShieldCheck } from 'lucide-react';

export const AIEntityExtractionModule: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    'أعلن إيلون ماسك، رئيس شركة تسلا وSpaceX، خلال مؤتمر القمة العالمية للتقنية في الرياض عن إطلاق شراكة استراتيجية كبرى مع الحكومة السعودية وشركة أرامكو لتطوير مراكز بيانات ذكية.'
  );
  const [inputTitle, setInputTitle] = useState<string>(
    'إيلون ماسك يعلن شراكة استراتيجية كبرى في الرياض لتطوير مراكز البيانات'
  );
  const [sourceName, setSourceName] = useState<string>('رويترز العربية');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionResult, setExtractionResult] = useState<AIPipelineResult | null>(null);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  const handleRunExtraction = async () => {
    setIsExtracting(true);
    setSavedStatus(false);
    try {
      const result = await aiEngineService.processArticleWithAI(inputTitle, inputText, sourceName);
      setExtractionResult(result);
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveStructuredData = () => {
    if (!extractionResult) return;
    // Save to localStorage or structured store
    const existing = JSON.parse(localStorage.getItem('naw3iya_extracted_entities') || '[]');
    const newRecord = {
      id: Date.now().toString(),
      title: inputTitle,
      sourceName,
      timestamp: new Date().toISOString(),
      entities: {
        people: extractionResult.people,
        companies: extractionResult.companies,
        countries: extractionResult.countries,
        cities: extractionResult.cities,
        events: extractionResult.events,
      },
      seoMeta: extractionResult.seoMeta,
      summary: extractionResult.arabicSummary,
    };
    localStorage.setItem('naw3iya_extracted_entities', JSON.stringify([newRecord, ...existing]));
    setSavedStatus(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">وحدة استخراج الكيانات الذكية (Gemini AI Entity Extraction)</h2>
            <p className="text-sm text-slate-400">
              تحليل نصوص الأخبار واستخراج الأشخاص، الشركات، المواقع، والأحداث بدقة عالية عبر خوارزميات الذكاء الاصطناعي المؤسسي
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">اسم المصدر الإخباري</label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="مثال: رويترز العربية"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-slate-300">عنوان الخبر</label>
            <input
              type="text"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="عنوان الخبر..."
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-slate-300">نص الخبر الكامل للتحليل واستخراج الكيانات</label>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
            placeholder="الصق نص الخبر هنا..."
          />
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>مدعوم بنموذج Gemini 2.5 Flash الذكي مع تدقيق لغوي</span>
          </div>
          <Button
            onClick={handleRunExtraction}
            disabled={isExtracting}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري استخراج الكيانات والتحليل...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>بدء استخراج الكيانات بالذكاء الاصطناعي</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {extractionResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary & Meta Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                  {extractionResult.category} / {extractionResult.subCategory}
                </Badge>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>مؤشر الموثوقية:</span>
                  <strong className="text-emerald-400 text-sm">{extractionResult.trustScore}%</strong>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-2">{extractionResult.catchyTitle}</h3>
                <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  {extractionResult.arabicSummary}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {extractionResult.keywords.map((kw, i) => (
                    <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
                      #{kw}
                    </span>
                  ))}
                </div>
                <Button
                  onClick={handleSaveStructuredData}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow"
                >
                  {savedStatus ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>تم الحفظ بنجاح</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>حفظ الهيكل في القاعدة</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sentiment & Quick Stats */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">تحليل المشاعر والسياق</h4>
                <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-3">
                  <span className="text-xs text-slate-400">التوجه العام:</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    extractionResult.sentiment === 'Positive' ? 'bg-emerald-500/20 text-emerald-300' :
                    extractionResult.sentiment === 'Negative' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {extractionResult.sentiment === 'Positive' ? 'إيجابي' : extractionResult.sentiment === 'Negative' ? 'سلبي' : 'حيادي'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p><strong>الزاوية الفريدة:</strong> {extractionResult.uniqueAngle}</p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <div className="text-xs text-slate-400">
                  <p className="font-semibold text-slate-300 mb-1">بيانات الـ SEO:</p>
                  <p className="truncate"><strong>العنوان:</strong> {extractionResult.seoMeta.seoTitle}</p>
                  <p className="truncate"><strong>Slug:</strong> {extractionResult.seoMeta.slug}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Structured Entities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* People */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Users className="w-4 h-4" />
                <span>الشخصيات البارزة ({extractionResult.people.length})</span>
              </div>
              <div className="space-y-2">
                {extractionResult.people.length > 0 ? (
                  extractionResult.people.map((person, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800/80 px-3 py-2 rounded-xl text-sm text-slate-200 flex items-center justify-between">
                      <span>{person}</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md">شخصية</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">لا توجد شخصيات مستخرجة</p>
                )}
              </div>
            </div>

            {/* Companies */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Building2 className="w-4 h-4" />
                <span>الشركات والمؤسسات ({extractionResult.companies.length})</span>
              </div>
              <div className="space-y-2">
                {extractionResult.companies.length > 0 ? (
                  extractionResult.companies.map((company, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800/80 px-3 py-2 rounded-xl text-sm text-slate-200 flex items-center justify-between">
                      <span>{company}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md">مؤسسة</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">لا توجد شركات مستخرجة</p>
                )}
              </div>
            </div>

            {/* Locations */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <MapPin className="w-4 h-4" />
                <span>المواقع والدول ({extractionResult.countries.length + extractionResult.cities.length})</span>
              </div>
              <div className="space-y-2">
                {[...extractionResult.countries, ...extractionResult.cities].length > 0 ? (
                  [...extractionResult.countries, ...extractionResult.cities].map((loc, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800/80 px-3 py-2 rounded-xl text-sm text-slate-200 flex items-center justify-between">
                      <span>{loc}</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md">موقع</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">لا توجد مواقع مستخرجة</p>
                )}
              </div>
            </div>

            {/* Events */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm">
                <Calendar className="w-4 h-4" />
                <span>الأحداث والمؤتمرات ({extractionResult.events.length})</span>
              </div>
              <div className="space-y-2">
                {extractionResult.events.length > 0 ? (
                  extractionResult.events.map((event, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800/80 px-3 py-2 rounded-xl text-sm text-slate-200 flex items-center justify-between">
                      <span>{event}</span>
                      <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-md">حدث</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">لا توجد أحداث مستخرجة</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
