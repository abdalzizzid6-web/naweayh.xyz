import { NewsArticle, ArticleSourceInfo } from '../core/domain/types';
import { articlesRepository } from '../repositories/articlesRepository';
import { aiEngineService, AIPipelineResult } from '../ai-engine/AIEngineService';
import { sourcesRepository } from '../repositories/sourcesRepository';
import { buildArticleCanonicalUrl } from '../core/utils/urlUtils';

export interface DeduplicationComparisonResult {
  titleSimilarityScore: number;     // 0 - 100
  contentSimilarityScore: number;   // 0 - 100
  nlpEntityOverlapScore: number;    // 0 - 100
  semanticEmbeddingScore: number;   // 0 - 100
  overallSimilarityScore: number;  // 0 - 100
  isDuplicate: boolean;
  matchedArticleId?: string;
  matchedArticleTitle?: string;
  matchReason?: string;
}

export interface IngestionDeduplicationReport {
  status: 'CREATED_NEW' | 'MERGED_INTO_EXISTING';
  targetArticle: NewsArticle;
  matchedArticleId?: string;
  similarityDetails: DeduplicationComparisonResult;
  sourcesCount: number;
  hasNewInformation: boolean;
  addedDetailsSummary?: string;
}

export interface BatchIngestionResult {
  totalIngested: number;
  uniqueStoriesCreated: number;
  duplicatesMerged: number;
  reports: IngestionDeduplicationReport[];
}

export class DuplicateDetectionEngine {
  private readonly SIMILARITY_THRESHOLD = 50; // Threshold for considering 2 articles the same story

  /**
   * Main Engine Method: Process an incoming raw news item, evaluate against all existing articles,
   * deduplicate, attach/rank sources, and update existing article if new information exists.
   */
  public async processAndDeduplicate(
    rawTitle: string,
    rawText: string,
    sourceId: string,
    category: string = 'عام',
    country: string = 'السعودية'
  ): Promise<IngestionDeduplicationReport> {
    const sourceInfo = sourcesRepository.getById(sourceId);
    const sourceName = sourceInfo ? sourceInfo.name : 'مصدر إخباري';
    const sourceReliability = sourceInfo ? sourceInfo.reliabilityRating : 80;

    // 1. Run full 18-Step AI NLP Pipeline on incoming news item
    const aiResult = await aiEngineService.processArticleWithAI(rawTitle, rawText, sourceName);

    // 2. Fetch existing stored articles to compare
    const existingArticles = articlesRepository.getAll();

    // 3. Find best match using multi-layered algorithm (Title, Content, NLP Entities, Embeddings)
    let bestMatch: { article: NewsArticle; comparison: DeduplicationComparisonResult } | null = null;
    let highestScore = 0;

    for (const existing of existingArticles) {
      const comparison = this.compareArticles(
        {
          title: aiResult.catchyTitle || rawTitle,
          content: aiResult.adFreeContent || rawText,
          keywords: aiResult.keywords,
          people: aiResult.people,
          companies: aiResult.companies,
          locations: aiResult.cities.concat(aiResult.countries),
        },
        existing
      );

      if (comparison.isDuplicate && comparison.overallSimilarityScore > highestScore) {
        highestScore = comparison.overallSimilarityScore;
        bestMatch = { article: existing, comparison };
      }
    }

    // 4. Case A: Duplicate Found! Merge source, re-rank sources by reliability, and update article with new info
    if (bestMatch) {
      const targetArticle = bestMatch.article;
      const comparison = bestMatch.comparison;

      // Prepare new source item
      const newSourceItem: ArticleSourceInfo = {
        id: sourceId,
        name: sourceName,
        logo: sourceInfo?.logo || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
        url: sourceInfo?.url || '',
        publishedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        reliabilityScore: sourceReliability,
        isPrimary: false,
      };

      // Check if source already exists in article sources list
      const sourceExists = targetArticle.sources.some((s) => s.id === sourceId || s.name === sourceName);
      let updatedSources = [...targetArticle.sources];

      if (!sourceExists) {
        updatedSources.push(newSourceItem);
      }

      // Re-rank all sources strictly by Reliability Score
      updatedSources.sort((a, b) => b.reliabilityScore - a.reliabilityScore);

      // Re-assign Primary Source flag to highest reliability source
      updatedSources = updatedSources.map((s, index) => ({
        ...s,
        isPrimary: index === 0,
      }));

      // Check for New Information & Facts
      const { hasNewInfo, updatedContent, updatedSummary, addedDetails } = this.detectAndMergeNewInformation(
        targetArticle,
        aiResult.adFreeContent || rawText,
        aiResult.arabicSummary
      );

      // Merge NLP entities
      const mergedEntities = {
        ...targetArticle.aiEntities,
        people: Array.from(new Set([...targetArticle.aiEntities.people, ...aiResult.people])),
        organizations: Array.from(new Set([...targetArticle.aiEntities.organizations, ...aiResult.companies])),
        locations: Array.from(new Set([...targetArticle.aiEntities.locations, ...aiResult.cities, ...aiResult.countries])),
        keywords: Array.from(new Set([...(targetArticle.aiEntities.keywords || []), ...aiResult.keywords])),
        events: Array.from(new Set([...(targetArticle.aiEntities.events || []), ...aiResult.events])),
      };

      // Calculate new consensus trust score based on number of sources & top primary reliability
      const topReliability = updatedSources[0]?.reliabilityScore || targetArticle.trustScore;
      const multiSourceBonus = Math.min(10, (updatedSources.length - 1) * 2);
      const newTrustScore = Math.min(99, Math.round(topReliability * 0.8 + multiSourceBonus + 10));

      const updatedArticle: NewsArticle = {
        ...targetArticle,
        sources: updatedSources,
        summary: updatedSummary,
        content: updatedContent,
        aiEntities: mergedEntities,
        trustScore: newTrustScore,
        updatedAt: hasNewInfo ? new Date().toISOString().replace('T', ' ').slice(0, 19) : targetArticle.updatedAt,
      };

      articlesRepository.update(targetArticle.id, updatedArticle);

      return {
        status: 'MERGED_INTO_EXISTING',
        targetArticle: updatedArticle,
        matchedArticleId: targetArticle.id,
        similarityDetails: comparison,
        sourcesCount: updatedSources.length,
        hasNewInformation: hasNewInfo,
        addedDetailsSummary: addedDetails,
      };
    }

    // 5. Case B: Unique News Story! Create a new consolidated article
    const newArticle: NewsArticle = {
      id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: aiResult.catchyTitle,
      slug: aiResult.seoMeta.slug,
      summary: aiResult.arabicSummary,
      content: aiResult.adFreeContent || rawText,
      mainImage: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
      galleryImages: [],
      category: aiResult.category || category || 'عام',
      subCategory: aiResult.subCategory,
      country: aiResult.countries[0] || country || 'السعودية',
      language: (aiResult.detectedLanguage as 'ar' | 'en') || 'ar',
      publishDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      readTimeMinutes: Math.max(1, Math.round((aiResult.adFreeContent || rawText).length / 300)),
      viewsCount: 1,
      sharesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
      isBreaking: aiResult.category === 'عاجل',
      isTrending: false,
      isEditorPick: false,
      trustScore: aiResult.trustScore,
      sources: [
        {
          id: sourceId,
          name: sourceName,
          logo: sourceInfo?.logo || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
          url: sourceInfo?.url || '',
          publishedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          reliabilityScore: sourceReliability,
          isPrimary: true,
        },
      ],
      aiEntities: {
        people: aiResult.people,
        organizations: aiResult.companies,
        locations: aiResult.cities.concat(aiResult.countries),
        countries: aiResult.countries,
        cities: aiResult.cities,
        events: aiResult.events,
        keywords: aiResult.keywords,
        tags: aiResult.seoMeta.tags,
        sentiment: aiResult.sentiment,
        trustScore: aiResult.trustScore,
        detectedLanguage: aiResult.detectedLanguage,
        paraphrasedSummary: aiResult.paraphrasedSummary,
        cleanedContent: aiResult.adFreeContent,
        catchyTitle: aiResult.catchyTitle,
        relatedArticleIds: aiResult.relatedArticleIds,
      },
      seoMeta: {
        title: aiResult.seoMeta.seoTitle,
        description: aiResult.seoMeta.metaDescription,
        keywords: aiResult.keywords,
        canonicalUrl: buildArticleCanonicalUrl(aiResult.seoMeta.slug),
        schemaType: 'NewsArticle',
        openGraphImage: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
      },
      socialPosts: [],
    };

    const saved = articlesRepository.add(newArticle);

    return {
      status: 'CREATED_NEW',
      targetArticle: saved,
      similarityDetails: {
        titleSimilarityScore: 0,
        contentSimilarityScore: 0,
        nlpEntityOverlapScore: 0,
        semanticEmbeddingScore: 0,
        overallSimilarityScore: 0,
        isDuplicate: false,
      },
      sourcesCount: 1,
      hasNewInformation: false,
    };
  }

  /**
   * Batch process up to 100 raw articles (Simulating 100 newspapers publishing same news item)
   */
  public async processBatchArticles(
    items: Array<{ title: string; text: string; sourceId: string; category?: string; country?: string }>
  ): Promise<BatchIngestionResult> {
    const reports: IngestionDeduplicationReport[] = [];
    let uniqueStoriesCount = 0;
    let duplicatesMergedCount = 0;

    for (const item of items) {
      const report = await this.processAndDeduplicate(
        item.title,
        item.text,
        item.sourceId,
        item.category,
        item.country
      );
      reports.push(report);

      if (report.status === 'CREATED_NEW') {
        uniqueStoriesCount++;
      } else {
        duplicatesMergedCount++;
      }
    }

    return {
      totalIngested: items.length,
      uniqueStoriesCreated: uniqueStoriesCount,
      duplicatesMerged: duplicatesMergedCount,
      reports,
    };
  }

  /**
   * Multi-layered comparison algorithm evaluating Title, Content, NLP Entities, and Embeddings
   */
  public compareArticles(
    incoming: {
      title: string;
      content: string;
      keywords: string[];
      people: string[];
      companies: string[];
      locations: string[];
    },
    existing: NewsArticle
  ): DeduplicationComparisonResult {
    // 1. Title Similarity Score (Levenshtein + N-gram Jaccard)
    const titleSimilarityScore = this.computeTitleSimilarity(incoming.title, existing.title);

    // 2. Content Similarity Score (Word Token Overlap + TF-IDF Jaccard)
    const contentSimilarityScore = this.computeContentSimilarity(incoming.content, existing.content);

    // 3. NLP Entity Overlap Score (People, Orgs, Locations, Keywords)
    const nlpEntityOverlapScore = this.computeNLPEntityOverlap(incoming, existing);

    // 4. Semantic Embedding Score (High dimensional contextual vector similarity)
    const semanticEmbeddingScore = this.computeSemanticEmbeddingScore(incoming, existing);

    // Weighted Overall Similarity
    // Weights: Title (35%), Content (25%), NLP Entities (25%), Semantic Embeddings (15%)
    const overallSimilarityScore = Math.round(
      titleSimilarityScore * 0.35 +
        contentSimilarityScore * 0.25 +
        nlpEntityOverlapScore * 0.25 +
        semanticEmbeddingScore * 0.15
    );

    const isDuplicate = overallSimilarityScore >= this.SIMILARITY_THRESHOLD;

    let matchReason = '';
    if (isDuplicate) {
      if (titleSimilarityScore > 75) matchReason = 'مطابقة تامة في عنوان الخبر والكلمات الرئيسية';
      else if (nlpEntityOverlapScore > 70) matchReason = 'تطابق عالي في الشخصيات والمنظمات والموقع الجغرافي';
      else if (semanticEmbeddingScore > 70) matchReason = 'مطابقة دلالية سياقية في سياق الحدث الإخباري';
      else matchReason = 'تطابق في الفحوى والمحتوى التحريري للخبر';
    }

    return {
      titleSimilarityScore,
      contentSimilarityScore,
      nlpEntityOverlapScore,
      semanticEmbeddingScore,
      overallSimilarityScore,
      isDuplicate,
      matchedArticleId: isDuplicate ? existing.id : undefined,
      matchedArticleTitle: isDuplicate ? existing.title : undefined,
      matchReason,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                      Sub-Algorithms for Multi-Layer Matching               */
  /* -------------------------------------------------------------------------- */

  // 1. Title Matching Algorithm
  private computeTitleSimilarity(titleA: string, titleB: string): number {
    if (!titleA || !titleB) return 0;
    const cleanA = this.normalizeText(titleA);
    const cleanB = this.normalizeText(titleB);

    if (cleanA === cleanB) return 100;

    const tokensA = new Set(cleanA.split(/\s+/).filter((w) => w.length > 2));
    const tokensB = new Set(cleanB.split(/\s+/).filter((w) => w.length > 2));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
    const union = new Set([...tokensA, ...tokensB]);
    const jaccard = (intersection.size / union.size) * 100;

    // Levenshtein ratio
    const levRatio = (1 - this.levenshteinDistance(cleanA, cleanB) / Math.max(cleanA.length, cleanB.length)) * 100;

    return Math.round(jaccard * 0.6 + levRatio * 0.4);
  }

  // 2. Content Matching Algorithm
  private computeContentSimilarity(contentA: string, contentB: string): number {
    if (!contentA || !contentB) return 0;
    const cleanA = this.normalizeText(contentA);
    const cleanB = this.normalizeText(contentB);

    const wordsA = cleanA.split(/\s+/).filter((w) => w.length > 3);
    const wordsB = cleanB.split(/\s+/).filter((w) => w.length > 3);

    const freqA: Record<string, number> = {};
    const freqB: Record<string, number> = {};

    wordsA.forEach((w) => (freqA[w] = (freqA[w] || 0) + 1));
    wordsB.forEach((w) => (freqB[w] = (freqB[w] || 0) + 1));

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
    allWords.forEach((word) => {
      const valA = freqA[word] || 0;
      const valB = freqB[word] || 0;
      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    });

    if (normA === 0 || normB === 0) return 0;

    const cosineSim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.round(cosineSim * 100);
  }

  // 3. NLP Entity Overlap Algorithm
  private computeNLPEntityOverlap(
    incoming: {
      keywords: string[];
      people: string[];
      companies: string[];
      locations: string[];
    },
    existing: NewsArticle
  ): number {
    const existingEntities = [
      ...existing.aiEntities.people,
      ...existing.aiEntities.organizations,
      ...existing.aiEntities.locations,
      ...(existing.aiEntities.keywords || []),
      ...(existing.aiEntities.events || []),
    ].map((e) => this.normalizeText(e));

    const incomingEntities = [
      ...incoming.people,
      ...incoming.companies,
      ...incoming.locations,
      ...incoming.keywords,
    ].map((e) => this.normalizeText(e));

    const setExisting = new Set(existingEntities.filter((e) => e.length > 2));
    const setIncoming = new Set(incomingEntities.filter((e) => e.length > 2));

    if (setExisting.size === 0 || setIncoming.size === 0) return 30; // fallback default neutral score

    const intersection = new Set([...setIncoming].filter((x) => setExisting.has(x)));
    const overlapRatio = intersection.size / Math.min(setExisting.size, setIncoming.size);

    return Math.round(overlapRatio * 100);
  }

  // 4. Semantic Embedding Simulation Algorithm
  private computeSemanticEmbeddingScore(
    incoming: { title: string; content: string },
    existing: NewsArticle
  ): number {
    // Generates high-dimensional n-gram semantic vector representation
    const textA = this.normalizeText(`${incoming.title} ${incoming.content.slice(0, 300)}`);
    const textB = this.normalizeText(`${existing.title} ${existing.content.slice(0, 300)}`);

    const nGramsA = this.getCharNGrams(textA, 3);
    const nGramsB = this.getCharNGrams(textB, 3);

    const intersection = new Set([...nGramsA].filter((x) => nGramsB.has(x)));
    const union = new Set([...nGramsA, ...nGramsB]);

    if (union.size === 0) return 0;
    return Math.round((intersection.size / union.size) * 100);
  }

  // Detect and Merge New Information
  private detectAndMergeNewInformation(
    existingArticle: NewsArticle,
    incomingText: string,
    incomingSummary: string
  ): { hasNewInfo: boolean; updatedContent: string; updatedSummary: string; addedDetails?: string } {
    const cleanExisting = this.normalizeText(existingArticle.content);
    const cleanIncoming = this.normalizeText(incomingText);

    // Check if incoming text has unique sentences not in existing content
    const incomingSentences = incomingText.split(/[.!?\n]/).filter((s) => s.trim().length > 20);
    const newSentences: string[] = [];

    incomingSentences.forEach((sentence) => {
      const normS = this.normalizeText(sentence);
      if (normS.length > 20 && !cleanExisting.includes(normS.slice(0, 30))) {
        newSentences.push(sentence.trim());
      }
    });

    if (newSentences.length > 0) {
      const addedDetails = `تمت إضافة ${newSentences.length} تفاصيل جديدة من المصادر الأخيرة.`;
      const updatedContent = `${existingArticle.content}\n\nتحديث إضافي من المصادر الموثوقة:\n${newSentences.join('. ')}.`;
      const updatedSummary = `${existingArticle.summary} (محدّث بالتفاصيل الأخيرة)`;

      return {
        hasNewInfo: true,
        updatedContent,
        updatedSummary,
        addedDetails,
      };
    }

    return {
      hasNewInfo: false,
      updatedContent: existingArticle.content,
      updatedSummary: existingArticle.summary,
    };
  }

  /* Helper String Utilities */
  private normalizeText(input: string): string {
    if (!input) return '';
    return input
      .replace(/[\u064B-\u0652]/g, '') // Remove Arabic Tashkeel
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  private getCharNGrams(text: string, n: number): Set<string> {
    const nGrams = new Set<string>();
    for (let i = 0; i <= text.length - n; i++) {
      nGrams.add(text.substring(i, i + n));
    }
    return nGrams;
  }
}

export const duplicateDetectionEngine = new DuplicateDetectionEngine();
