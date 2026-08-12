import { articlesRepository } from '../repositories/articlesRepository';
import { NewsArticle } from '../core';

export interface AIPipelineResult {
  // Step 1: HTML Sanitization
  cleanedHtml: string;
  // Step 2: Code & Script Removal
  codeRemovedContent: string;
  // Step 3: Ad & Promo Removal
  adFreeContent: string;
  // Step 4: Language Detection
  detectedLanguage: 'ar' | 'en' | 'fr' | 'es' | 'de' | string;
  // Step 5: Machine Translation
  translatedArabicTitle?: string;
  translatedArabicContent?: string;
  // Step 6: Summarization
  arabicSummary: string;
  // Step 7: Paraphrased Summary
  paraphrasedSummary: string;
  // Step 8: Catchy Title Generation
  catchyTitle: string;
  // Step 9: Keyword Extraction
  keywords: string[];
  // Step 10: People Extraction
  people: string[];
  // Step 11: Companies Extraction
  companies: string[];
  // Step 12: Country Extraction
  countries: string[];
  // Step 13: City Extraction
  cities: string[];
  // Step 14: Event Extraction
  events: string[];
  // Step 15: Classification
  category: string;
  subCategory: string;
  // Step 16: Trust Score Evaluation
  trustScore: number;
  // Step 17: SEO Metadata Generation
  seoMeta: {
    seoTitle: string;
    metaDescription: string;
    tags: string[];
    slug: string;
  };
  // Step 18: Deduplication & Similar Linkage
  isDuplicate: boolean;
  relatedArticleIds: string[];
  similarityScore: number;
  uniqueAngle: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export class AIEngineService {

  /**
   * Complete 18-Step Automated AI News Processing Pipeline
   */
  public async processArticleWithAI(
    rawTitle: string,
    rawText: string,
    sourceName: string
  ): Promise<AIPipelineResult> {
    // Step 1: HTML Sanitization
    const cleanedHtml = this.sanitizeHtml(rawText);

    // Step 2: Code & Script Removal
    const codeRemovedContent = this.removeCodeAndScripts(cleanedHtml);

    // Step 3: Ad & Promo Removal
    const adFreeContent = this.removeAdsAndPromos(codeRemovedContent);

    // Step 4: Language Detection
    const detectedLanguage = this.detectLanguage(adFreeContent || rawTitle);

    // Step 5: Machine Translation if non-Arabic
    const isArabic = detectedLanguage === 'ar';
    const translatedArabicTitle = isArabic
      ? rawTitle
      : this.heuristicTranslate(rawTitle);
    const translatedArabicContent = isArabic
      ? adFreeContent
      : this.heuristicTranslate(adFreeContent);

    // Call server-side API endpoint for Gemini processing to protect API key secrets
    let geminiParsed: any = null;
    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: translatedArabicTitle,
          content: translatedArabicContent,
          sourceName,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          geminiParsed = json.data;
        }
      }
    } catch (apiErr) {
      console.warn('[AIEngineService] Server-side AI processing API skipped or unavailable, falling back to deterministic processing:', apiErr);
    }

    // Step 6: Summarization
    const arabicSummary =
      geminiParsed?.arabicSummary ||
      this.generateFallbackSummary(translatedArabicContent);

    // Step 7: Paraphrasing
    const paraphrasedSummary =
      geminiParsed?.paraphrasedSummary ||
      this.paraphraseText(arabicSummary);

    // Step 8: Catchy Title Generation
    const catchyTitle =
      geminiParsed?.catchyTitle ||
      this.generateCatchyTitle(translatedArabicTitle, translatedArabicContent);

    // Step 9: Keywords Extraction
    const keywords =
      geminiParsed?.keywords ||
      this.extractKeywords(translatedArabicContent);

    // Step 10: People Extraction
    const people =
      geminiParsed?.people ||
      this.extractPeople(translatedArabicContent);

    // Step 11: Companies Extraction
    const companies =
      geminiParsed?.companies ||
      this.extractCompanies(translatedArabicContent);

    // Step 12: Country Extraction
    const countries =
      geminiParsed?.countries ||
      this.extractCountries(translatedArabicContent);

    // Step 13: City Extraction
    const cities =
      geminiParsed?.cities ||
      this.extractCities(translatedArabicContent);

    // Step 14: Event Extraction
    const events =
      geminiParsed?.events ||
      this.extractEvents(translatedArabicContent);

    // Step 15: Classification
    const category =
      geminiParsed?.category ||
      this.classifyCategory(translatedArabicContent);
    const subCategory =
      geminiParsed?.subCategory || 'تغطية عامة';

    // Step 16: Trust Score Evaluation
    const trustScore =
      geminiParsed?.trustScore ||
      this.evaluateTrustScore(sourceName, translatedArabicContent, people, companies);

    // Step 17: SEO Meta Generation
    const slug =
      geminiParsed?.slug ||
      this.generateSlug(catchyTitle);
    const seoTitle =
      geminiParsed?.seoTitle ||
      `${catchyTitle} | تغطية إخبارية شاملة`;
    const metaDescription =
      geminiParsed?.metaDescription ||
      arabicSummary.slice(0, 155);
    const tags =
      geminiParsed?.tags ||
      keywords.slice(0, 5).map((k) => `#${k.replace(/\s+/g, '_')}`);

    // Step 18: Deduplication & Linking Similar Articles
    const existingArticles = articlesRepository.getAll();
    const { isDuplicate, relatedArticleIds, similarityScore } =
      this.linkSimilarArticles(catchyTitle, keywords, existingArticles);

    return {
      cleanedHtml,
      codeRemovedContent,
      adFreeContent,
      detectedLanguage,
      translatedArabicTitle: isArabic ? undefined : translatedArabicTitle,
      translatedArabicContent: isArabic ? undefined : translatedArabicContent,
      arabicSummary,
      paraphrasedSummary,
      catchyTitle,
      keywords,
      people,
      companies,
      countries,
      cities,
      events,
      category,
      subCategory,
      trustScore,
      seoMeta: {
        seoTitle,
        metaDescription,
        tags,
        slug,
      },
      isDuplicate,
      relatedArticleIds,
      similarityScore,
      uniqueAngle: geminiParsed?.uniqueAngle || `تغطية خاصة وموثقة عبر ${sourceName}`,
      sentiment: geminiParsed?.sentiment || 'Neutral',
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                      Automated Helper Pipeline Rules                        */
  /* -------------------------------------------------------------------------- */

  // 1. HTML Sanitizer
  private sanitizeHtml(rawHtml: string): string {
    if (!rawHtml) return '';
    return rawHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 2. Code & Script Remover
  private removeCodeAndScripts(input: string): string {
    return input
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/javascript:[^\s]*/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/\{[\s\S]*?\}/g, (match) => (match.length > 80 && match.includes(';') ? '' : match))
      .trim();
  }

  // 3. Ad & Promo Cleaner
  private removeAdsAndPromos(input: string): string {
    const promoRegexes = [
      /اشترك الآن في قناة[^\n.]*/gi,
      /تابعنا على[^\n.]*/gi,
      /إعلان مدفوع[^\n.]*/gi,
      /Sponsored[^\n.]*/gi,
      /جميع الحقوق محفوظة[^\n.]*/gi,
      /اضغط هنا للمزيد[^\n.]*/gi,
      /Click here to read more[^\n.]*/gi,
      /Ad:[^\n.]*/gi,
    ];
    let cleaned = input;
    promoRegexes.forEach((rx) => {
      cleaned = cleaned.replace(rx, '');
    });
    return cleaned.trim();
  }

  // 4. Language Detector
  private detectLanguage(input: string): string {
    const arabicChars = input.match(/[\u0600-\u06FF]/g) || [];
    const totalAlpha = input.match(/[a-zA-Z\u0600-\u06FF]/g) || [];
    if (totalAlpha.length === 0) return 'ar';
    const arabicRatio = arabicChars.length / totalAlpha.length;
    return arabicRatio > 0.3 ? 'ar' : 'en';
  }

  // 5. Heuristic Machine Translator
  private heuristicTranslate(text: string): string {
    if (!text) return '';
    // Dictionary mapping for key english news terms
    const dict: Record<string, string> = {
      global: 'عالمي',
      market: 'سوق',
      markets: 'أسواق',
      surge: 'ارتفاع حاد',
      rally: 'تعافي',
      stocks: 'أسهم',
      tech: 'تكنولوجيا',
      clean: 'نظيفة',
      energy: 'طاقة',
      breakthrough: 'إنجاز تاريخي',
      announces: 'يعلن',
      summit: 'قمة',
      economy: 'اقتصاد',
      oil: 'نفط',
      prices: 'أسعار',
      ai: 'الذكاء الاصطناعي',
      security: 'الأمن',
      cyber: 'السيبراني',
    };
    let translated = text;
    Object.keys(dict).forEach((eng) => {
      const rx = new RegExp(`\\b${eng}\\b`, 'gi');
      translated = translated.replace(rx, dict[eng]);
    });

    if (!/[\u0600-\u06FF]/.test(translated)) {
      return `[ترجمة آلياً]: ${text}`;
    }
    return translated;
  }

  // 6. Summarization Fallback
  private generateFallbackSummary(text: string): string {
    const sentences = text.split(/[.!?\n]/).filter((s) => s.trim().length > 15);
    if (sentences.length === 0) return text.slice(0, 180);
    return sentences.slice(0, 3).join('. ').trim() + '.';
  }

  // 7. Paraphraser
  private paraphraseText(summary: string): string {
    return summary
      .replace(/أعلن/g, 'كشف')
      .replace(/شهدت/g, 'رصدت')
      .replace(/أكد/g, 'شدد على أن')
      .replace(/تمت/g, 'اكتملت')
      .replace(/يهدف/g, 'يسعى إلى');
  }

  // 8. Catchy Title Generator
  private generateCatchyTitle(title: string, text: string): string {
    if (title && title.length > 15) {
      if (!title.startsWith('تغطية') && !title.startsWith('عاجل')) {
        return `${title}`;
      }
      return title;
    }
    return text.slice(0, 60) + '...';
  }

  // 9. Keyword Extractor
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['في', 'من', 'على', 'عن', 'مع', 'هذا', 'هذه', 'تم', 'كان', 'أن', 'إلى', 'أو', 'التي', 'الذي', 'بعد', 'قبل']);
    const words = text
      .replace(/[^\u0600-\u06FFa-zA-Z]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    const freq: Record<string, number> = {};
    words.forEach((w) => {
      freq[w] = (freq[w] || 0) + 1;
    });

    return Object.keys(freq)
      .sort((a, b) => freq[b] - freq[a])
      .slice(0, 6);
  }

  // 10. People Extractor
  private extractPeople(text: string): string[] {
    const peoplePattern = /(?:د\.|م\.|الأمير|الملك|الشيخ|الرئيس|الوزير|السفير|الدكتور|المهندس)\s+([\u0600-\u06FF]{3,15}\s+[\u0600-\u06FF]{3,15})/g;
    const matches: string[] = [];
    let match;
    while ((match = peoplePattern.exec(text)) !== null) {
      if (match[0] && !matches.includes(match[0])) {
        matches.push(match[0]);
      }
    }
    return matches.length > 0 ? matches.slice(0, 4) : ['مسؤول رسمي'];
  }

  // 11. Companies / Organizations Extractor
  private extractCompanies(text: string): string[] {
    const orgKeywords = ['وزارة', 'هيئة', 'شركة', 'صندوق', 'بنك', 'منظمة', 'جامعة', 'معهد', 'تحالف', 'شبكة', 'وكالة', 'Google', 'Apple', 'Reuters', 'SPA'];
    const found: string[] = [];
    orgKeywords.forEach((kw) => {
      const rx = new RegExp(`(?:${kw})\\s+([\\u0600-\\u06FFa-zA-Z]{3,20}(?:\\s+[\\u0600-\\u06FFa-zA-Z]{3,20})?)`, 'g');
      let m;
      while ((m = rx.exec(text)) !== null) {
        if (m[0] && !found.includes(m[0])) {
          found.push(m[0]);
        }
      }
    });
    return found.length > 0 ? found.slice(0, 4) : ['المؤسسة الوطنية'];
  }

  // 12. Country Extractor
  private extractCountries(text: string): string[] {
    const countryList = [
      'السعودية', 'الإمارات', 'قطر', 'الكويت', 'مصر', 'الأردن', 'عمان', 'البحرين',
      'أمريكا', 'بريطانيا', 'الصين', 'ألمانيا', 'فرنسا', 'اليابان', 'روسيا'
    ];
    return countryList.filter((c) => text.includes(c));
  }

  // 13. City Extractor
  private extractCities(text: string): string[] {
    const cityList = [
      'الرياض', 'جدة', 'دبي', 'أبوظبي', 'القاهرة', 'واشنطن', 'لندن', 'باريس', 'طوكيو', 'بكين', 'جنيف', 'الدوحة', 'الكويت'
    ];
    return cityList.filter((c) => text.includes(c));
  }

  // 14. Event Extractor
  private extractEvents(text: string): string[] {
    const eventKeywords = ['قمة', 'مؤتمر', 'منتدى', 'معرض', 'مباراة', 'تصفيات', 'حفل', 'ملتقى'];
    const found: string[] = [];
    eventKeywords.forEach((ev) => {
      const rx = new RegExp(`(?:${ev})\\s+([\\u0600-\\u06FF]{3,20}(?:\\s+[\\u0600-\\u06FF]{3,20})?)`, 'g');
      let m;
      while ((m = rx.exec(text)) !== null) {
        if (m[0] && !found.includes(m[0])) {
          found.push(m[0]);
        }
      }
    });
    return found.length > 0 ? found.slice(0, 3) : ['مبادرة إقليمية'];
  }

  // 15. Classification
  private classifyCategory(text: string): string {
    if (/طاقة|نفط|أسهم|اقتصاد|استثمار|مالية|بنك|تجارة/i.test(text)) return 'اقتصاد';
    if (/ذكاء|تقنية|برمجة|بيانات|سحابة|أمن سيبراني|كمبيوتر/i.test(text)) return 'تكنولوجيا';
    if (/كرة|مباراة|منتخب|دوري|لاعب|هدف|بطولة/i.test(text)) return 'رياضة';
    if (/طب|صحة|لقاح|مرض|علاج|مستشفى|أبحاث/i.test(text)) return 'علوم';
    if (/عاجل|أنباء|وزراء|رئيس|حكومة|اتفاقية/i.test(text)) return 'سياسة';
    return 'عام';
  }

  // 16. Trust Score Calculator
  private evaluateTrustScore(
    sourceName: string,
    text: string,
    people: string[],
    companies: string[]
  ): number {
    let score = 80;
    if (/SPA|رويترز|BBC|CNN|الجزيرة|العربية|Nature|Bloomberg/i.test(sourceName)) {
      score += 12;
    }
    if (text.includes('صرح') || text.includes('أكد') || text.includes('وفقاً لـ')) {
      score += 5;
    }
    if (people.length > 0 && people[0] !== 'مسؤول رسمي') score += 2;
    if (companies.length > 0) score += 1;
    return Math.min(99, score);
  }

  // 17. Slug Generator
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
  }

  // 18. Deduplication & Similar Story Linker
  private linkSimilarArticles(
    title: string,
    keywords: string[],
    existingArticles: NewsArticle[]
  ) {
    const relatedArticleIds: string[] = [];
    let isDuplicate = false;
    let maxSim = 0;

    const titleWords = new Set(title.toLowerCase().split(/\s+/));

    existingArticles.forEach((art) => {
      const artWords = new Set(art.title.toLowerCase().split(/\s+/));
      const intersection = new Set([...titleWords].filter((x) => artWords.has(x)));
      const union = new Set([...titleWords, ...artWords]);
      const sim = Math.round((intersection.size / union.size) * 100);

      if (sim > maxSim) maxSim = sim;

      if (sim > 25) {
        relatedArticleIds.push(art.id);
      }
      if (sim > 65) {
        isDuplicate = true;
      }
    });

    return {
      isDuplicate,
      relatedArticleIds: relatedArticleIds.slice(0, 5),
      similarityScore: maxSim,
    };
  }
}

export const aiEngineService = new AIEngineService();
