export type ContentClassification = 
  | 'FULL_PERMITTED_CONTENT' 
  | 'FEED_CONTENT' 
  | 'EXCERPT_ONLY' 
  | 'EXTERNAL_SOURCE' 
  | 'FAILED_EXTRACTION';

export type ContentOrigin =
  | 'FULL_FEED'
  | 'OFFICIAL_API'
  | 'LICENSED'
  | 'EXTRACTED_PERMITTED'
  | 'EXCERPT';

export interface ExtractedArticleContent {
  title: string;
  subheadline?: string;
  formattedBody: string;
  summary: string;
  wordCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  contentClassification: ContentClassification;
  contentOrigin: ContentOrigin;
  contentQualityScore: number;
  isFullContentAvailable: boolean;
  leadImageUrl?: string;
  authorName?: string;
  publishedAt?: Date;
  canonicalUrl: string;
}

export class ContentExtractorService {
  /**
   * Classifies article content according to Phase 3.6 rules
   * RULE 17: If article contains Title + Description only, it MUST NOT be classified as FULL_PERMITTED_CONTENT.
   */
  public classifyContent(rawContent: string | undefined, rawDescription: string | undefined): {
    classification: ContentClassification;
    origin: ContentOrigin;
  } {
    const hasContent = rawContent && rawContent.trim().length > 0;
    const hasDescription = rawDescription && rawDescription.trim().length > 0;

    if (!hasContent && !hasDescription) {
      return { classification: 'FAILED_EXTRACTION', origin: 'EXCERPT' };
    }

    const contentText = (rawContent || '').replace(/<[^>]+>/g, ' ').trim();
    const descText = (rawDescription || '').replace(/<[^>]+>/g, ' ').trim();

    // If description equals content or rawContent was omitted (Title + Description only), MUST NOT be FULL_PERMITTED_CONTENT
    const isTitleDescOnly = !hasContent || contentText === descText || Math.abs(contentText.length - descText.length) < 30;

    if (isTitleDescOnly) {
      if (descText.length >= 250) {
        return { classification: 'FEED_CONTENT', origin: 'FULL_FEED' };
      }
      return { classification: 'EXCERPT_ONLY', origin: 'EXCERPT' };
    }

    // Explicit rich content:encoded with high character count
    if (hasContent && contentText.length > 600 && contentText.length > descText.length + 200) {
      return { classification: 'FULL_PERMITTED_CONTENT', origin: 'EXTRACTED_PERMITTED' };
    }

    if (descText.length >= 200) {
      return { classification: 'FEED_CONTENT', origin: 'FULL_FEED' };
    }

    return { classification: 'EXCERPT_ONLY', origin: 'EXCERPT' };
  }

  /**
   * Calculates content_quality_score (0 - 100)
   */
  public calculateQualityScore(params: {
    wordCount: number;
    paragraphCount: number;
    hasCoverImage: boolean;
    hasAuthor: boolean;
    hasPublishedAt: boolean;
    contentLength: number;
    classification: ContentClassification;
  }): number {
    let score = 20; // base

    if (params.wordCount >= 300) score += 25;
    else if (params.wordCount >= 150) score += 15;
    else if (params.wordCount >= 50) score += 10;

    if (params.paragraphCount >= 4) score += 20;
    else if (params.paragraphCount >= 2) score += 10;

    if (params.hasCoverImage) score += 15;
    if (params.hasAuthor) score += 10;
    if (params.hasPublishedAt) score += 10;

    if (params.classification === 'FULL_PERMITTED_CONTENT') score = Math.min(100, score + 10);
    else if (params.classification === 'EXCERPT_ONLY') score = Math.max(10, score - 20);

    return Math.min(100, Math.max(0, score));
  }
  /**
   * Sanitizes raw HTML content for safe, beautiful editorial presentation
   */
  public sanitizeHtml(rawHtml: string): string {
    if (!rawHtml) return '';

    return rawHtml
      // Remove dangerous tags and scripts
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      // Remove inline style attributes and event listeners
      .replace(/\s*style="[^"]*"/gi, '')
      .replace(/\s*on\w+="[^"]*"/gi, '')
      // Clean up empty tags and unwanted spacing
      .replace(/<p>\s*<\/p>/gi, '')
      .replace(/<div\b[^>]*>/gi, '<p>')
      .replace(/<\/div>/gi, '</p>')
      .trim();
  }

  /**
   * Calculates estimated reading time for Arabic text (avg 180 words/min)
   */
  public calculateReadingTime(text: string): { wordCount: number; readingTimeMinutes: number } {
    const plainText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plainText.split(' ').filter((w) => w.length > 0);
    const wordCount = words.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));
    return { wordCount, readingTimeMinutes };
  }

  /**
   * Formats raw text or HTML into structured Arabic editorial paragraphs
   */
  public formatEditorialBody(contentOrDescription: string, fallbackSummary: string): { formattedBody: string; summary: string; isFull: boolean } {
    const sanitized = this.sanitizeHtml(contentOrDescription);
    const plainText = sanitized.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const isFull = plainText.length > 300;
    const summary = fallbackSummary || plainText.slice(0, 350) + (plainText.length > 350 ? '...' : '');

    let formattedBody = sanitized;
    if (!sanitized.includes('<p>') && !sanitized.includes('<div>')) {
      const paragraphs = plainText
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      formattedBody = paragraphs.map((p) => `<p className="leading-relaxed mb-4 text-slate-800 text-justify">${p}</p>`).join('');
    }

    return {
      formattedBody,
      summary,
      isFull,
    };
  }

  /**
   * Process raw RSS item content into safe reader format
   */
  public extractFromFeedItem(rawContent: string, rawDescription: string, canonicalUrl: string, itemMeta?: {
    coverImage?: string;
    author?: string;
    publishedAt?: Date;
  }): ExtractedArticleContent {
    const { classification, origin } = this.classifyContent(rawContent, rawDescription);
    const bodySource = rawContent && rawContent.length > rawDescription.length ? rawContent : rawDescription;
    const { formattedBody, summary } = this.formatEditorialBody(bodySource, rawDescription);
    const { wordCount, readingTimeMinutes } = this.calculateReadingTime(formattedBody);
    
    const plainText = formattedBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const paragraphCount = plainText.split('\n\n').filter(p => p.trim().length > 0).length || Math.max(1, Math.ceil(wordCount / 50));

    const contentQualityScore = this.calculateQualityScore({
      wordCount,
      paragraphCount,
      hasCoverImage: Boolean(itemMeta?.coverImage),
      hasAuthor: Boolean(itemMeta?.author),
      hasPublishedAt: Boolean(itemMeta?.publishedAt),
      contentLength: plainText.length,
      classification,
    });

    return {
      title: '',
      formattedBody,
      summary,
      wordCount,
      paragraphCount,
      readingTimeMinutes,
      contentClassification: classification,
      contentOrigin: origin,
      contentQualityScore,
      isFullContentAvailable: classification === 'FULL_PERMITTED_CONTENT',
      canonicalUrl,
    };
  }
}

export const contentExtractorService = new ContentExtractorService();
