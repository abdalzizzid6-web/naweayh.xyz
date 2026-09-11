import { pool } from '../db/connection';
import { normalizeArabicText } from '../../src/infrastructure/utils/arabicNormalizer';

export interface CandidateArticle {
  id: number;
  title: string;
  normalizedTitle: string;
  canonicalUrl?: string;
  originalArticleUrl?: string;
  publishedAt: string;
  sourceId?: number;
  tokens: Set<string>;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateType: 'EXACT_URL' | 'EXACT_TITLE' | 'HIGH_SIMILARITY' | 'NONE';
  matchedArticleId?: number;
  matchedTitle?: string;
  similarityScore: number;
  reason?: string;
}

const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'على', 'عن', 'إلى', 'أن', 'إن', 'التي', 'الذي', 'الذين', 'اللتين',
  'و', 'أو', 'ثم', 'لكن', 'بل', 'لا', 'ما', 'هذا', 'هذه', 'هؤلاء', 'ذلك', 'تلك',
  'هو', 'هي', 'هم', 'هن', 'نحن', 'أنا', 'كان', 'كانت', 'يكون', 'تكون', 'مع',
  'بين', 'عند', 'حتى', 'إذا', 'كل', 'بعض', 'غير', 'كما', 'قد', 'لقد', 'حيث'
]);

export class DuplicateDetectionEngine {
  /**
   * Tokenize normalized Arabic text and eliminate stop words
   */
  public tokenize(text: string): Set<string> {
    if (!text) return new Set();
    const normalized = normalizeArabicText(text);
    const words = normalized
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !ARABIC_STOP_WORDS.has(w));
    return new Set(words);
  }

  /**
   * Build word frequency vector for Cosine Similarity
   */
  private getTermFrequencies(text: string): Map<string, number> {
    const map = new Map<string, number>();
    const normalized = normalizeArabicText(text);
    const words = normalized.split(/\s+/).filter((w) => w.length >= 2 && !ARABIC_STOP_WORDS.has(w));
    for (const w of words) {
      map.set(w, (map.get(w) || 0) + 1);
    }
    return map;
  }

  /**
   * Jaccard Similarity = |A ∩ B| / |A ∪ B|
   */
  public computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Cosine Similarity between term frequency maps
   */
  public computeCosineSimilarity(mapA: Map<string, number>, mapB: Map<string, number>): number {
    if (mapA.size === 0 || mapB.size === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const [term, freqA] of mapA.entries()) {
      normA += freqA * freqA;
      const freqB = mapB.get(term);
      if (freqB) {
        dotProduct += freqA * freqB;
      }
    }

    for (const [, freqB] of mapB.entries()) {
      normB += freqB * freqB;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Levenshtein Distance similarity ratio (0 to 1)
   */
  public computeLevenshteinSimilarity(s1: string, s2: string): number {
    const norm1 = normalizeArabicText(s1).replace(/\s+/g, '');
    const norm2 = normalizeArabicText(s2).replace(/\s+/g, '');

    if (norm1 === norm2) return 1.0;
    if (norm1.length === 0 || norm2.length === 0) return 0;

    // Use fast Levenshtein matrix
    const len1 = norm1.length;
    const len2 = norm2.length;
    
    // Memory safeguard for very long texts
    if (len1 > 300 || len2 > 300) {
      const sub1 = norm1.substring(0, 300);
      const sub2 = norm2.substring(0, 300);
      return this.computeLevenshteinSimilarity(sub1, sub2);
    }

    let prevRow = new Array(len2 + 1);
    let currRow = new Array(len2 + 1);

    for (let j = 0; j <= len2; j++) prevRow[j] = j;

    for (let i = 1; i <= len1; i++) {
      currRow[0] = i;
      const char1 = norm1[i - 1];

      for (let j = 1; j <= len2; j++) {
        const cost = char1 === norm2[j - 1] ? 0 : 1;
        currRow[j] = Math.min(
          currRow[j - 1] + 1,      // insertion
          prevRow[j] + 1,          // deletion
          prevRow[j - 1] + cost    // substitution
        );
      }

      for (let j = 0; j <= len2; j++) prevRow[j] = currRow[j];
    }

    const distance = prevRow[len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  }

  /**
   * Multi-algorithm combined similarity score
   */
  public computeCompositeSimilarity(textA: string, textB: string): {
    jaccard: number;
    cosine: number;
    levenshtein: number;
    composite: number;
  } {
    const tokensA = this.tokenize(textA);
    const tokensB = this.tokenize(textB);
    const jaccard = this.computeJaccardSimilarity(tokensA, tokensB);

    const freqA = this.getTermFrequencies(textA);
    const freqB = this.getTermFrequencies(textB);
    const cosine = this.computeCosineSimilarity(freqA, freqB);

    const levenshtein = this.computeLevenshteinSimilarity(textA, textB);

    // Weighted composite: Jaccard (45%), Cosine (35%), Levenshtein (20%)
    const composite = jaccard * 0.45 + cosine * 0.35 + levenshtein * 0.20;

    return { jaccard, cosine, levenshtein, composite };
  }

  /**
   * Pre-loads recent articles for fast in-memory candidate matching
   */
  public async loadRecentCandidates(hours: number = 72): Promise<CandidateArticle[]> {
    try {
      const res = await pool.query(
        `SELECT id, title, canonical_url, original_article_url, published_at, source_id
         FROM news_articles
         WHERE published_at >= NOW() - ($1 * INTERVAL '1 hour')
         ORDER BY published_at DESC
         LIMIT 1000`,
        [hours]
      );

      return res.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        normalizedTitle: normalizeArabicText(row.title),
        canonicalUrl: row.canonical_url,
        originalArticleUrl: row.original_article_url,
        publishedAt: row.published_at,
        sourceId: row.source_id,
        tokens: this.tokenize(row.title),
      }));
    } catch (err) {
      console.warn('[DuplicateDetectionEngine] Failed to load candidates from DB:', err);
      return [];
    }
  }

  /**
   * Checks if an incoming article is a duplicate using URL matching and multi-algorithm NLP similarity
   */
  public async checkDuplicate(
    input: {
      title: string;
      canonicalUrl: string;
      originalUrl?: string;
      summary?: string;
    },
    candidates?: CandidateArticle[]
  ): Promise<DuplicateCheckResult> {
    // Stage 1: Check Exact URL in Candidate List or Database
    if (candidates && candidates.length > 0) {
      const exactUrlMatch = candidates.find(
        (c) =>
          (c.canonicalUrl && c.canonicalUrl === input.canonicalUrl) ||
          (input.originalUrl && c.originalArticleUrl && c.originalArticleUrl === input.originalUrl)
      );

      if (exactUrlMatch) {
        return {
          isDuplicate: true,
          duplicateType: 'EXACT_URL',
          matchedArticleId: exactUrlMatch.id,
          matchedTitle: exactUrlMatch.title,
          similarityScore: 1.0,
          reason: `Exact URL match found with article #${exactUrlMatch.id}`,
        };
      }
    } else {
      // Direct DB query fallback
      try {
        const urlRes = await pool.query(
          `SELECT id, title FROM news_articles WHERE canonical_url = $1 OR (original_article_url = $2 AND $2 IS NOT NULL) LIMIT 1`,
          [input.canonicalUrl, input.originalUrl || null]
        );
        if (urlRes.rows.length > 0) {
          const row = urlRes.rows[0];
          return {
            isDuplicate: true,
            duplicateType: 'EXACT_URL',
            matchedArticleId: row.id,
            matchedTitle: row.title,
            similarityScore: 1.0,
            reason: `Exact canonical URL in database: article #${row.id}`,
          };
        }
      } catch {}
    }

    // Stage 2: Fast Normalized Title Exact Match
    const normalizedInputTitle = normalizeArabicText(input.title);
    const inputTokens = this.tokenize(input.title);

    const activeCandidates = candidates || (await this.loadRecentCandidates(72));

    for (const cand of activeCandidates) {
      if (cand.normalizedTitle === normalizedInputTitle) {
        return {
          isDuplicate: true,
          duplicateType: 'EXACT_TITLE',
          matchedArticleId: cand.id,
          matchedTitle: cand.title,
          similarityScore: 1.0,
          reason: `Exact normalized Arabic title match with article #${cand.id}`,
        };
      }
    }

    // Stage 3: Multi-Algorithm Similarity (Jaccard + Cosine + Levenshtein)
    let highestScore = 0;
    let bestMatch: CandidateArticle | null = null;
    let bestReason = '';

    for (const cand of activeCandidates) {
      // Quick pre-filter: require at least 2 common tokens or length similarity
      const jaccard = this.computeJaccardSimilarity(inputTokens, cand.tokens);
      if (jaccard < 0.35) continue;

      const fullAnalysis = this.computeCompositeSimilarity(input.title, cand.title);

      // Substring containment check for headlines (common in wire services like SPA, Reuters, Saba)
      const isSubstring =
        (normalizedInputTitle.length > 20 && cand.normalizedTitle.includes(normalizedInputTitle)) ||
        (cand.normalizedTitle.length > 20 && normalizedInputTitle.includes(cand.normalizedTitle));

      const finalScore = isSubstring ? Math.max(fullAnalysis.composite, 0.90) : fullAnalysis.composite;

      if (finalScore > highestScore) {
        highestScore = finalScore;
        bestMatch = cand;
        bestReason = `Similarity: Jaccard=${fullAnalysis.jaccard.toFixed(2)}, Cosine=${fullAnalysis.cosine.toFixed(2)}, Levenshtein=${fullAnalysis.levenshtein.toFixed(2)}`;
      }
    }

    // High similarity threshold: >= 0.72 indicates the same news item reworded or syndication
    if (bestMatch && highestScore >= 0.72) {
      return {
        isDuplicate: true,
        duplicateType: 'HIGH_SIMILARITY',
        matchedArticleId: bestMatch.id,
        matchedTitle: bestMatch.title,
        similarityScore: highestScore,
        reason: `High semantic similarity (${(highestScore * 100).toFixed(1)}%) with article #${bestMatch.id}. ${bestReason}`,
      };
    }

    return {
      isDuplicate: false,
      duplicateType: 'NONE',
      similarityScore: highestScore,
    };
  }
}

export const duplicateDetectionEngine = new DuplicateDetectionEngine();
