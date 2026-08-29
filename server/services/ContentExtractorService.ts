import { httpClientService } from './HttpClientService';

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

export type ContentStatus = 'full' | 'partial' | 'failed';
export type ContentSourceType = 'rss' | 'extractor' | 'api';

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
  contentStatus: ContentStatus;
  contentSource: ContentSourceType;
  contentQualityScore: number;
  isFullContentAvailable: boolean;
  leadImageUrl?: string;
  authorName?: string;
  publishedAt?: Date;
  canonicalUrl: string;
  paragraphs: string[];
}

export class ContentExtractorService {
  /**
   * Validates if a target URL is safe for server-side fetching (SSRF protection).
   * Blocks localhost, private IP ranges (RFC1918), loopback, link-local, cloud metadata, and non-http schemes.
   */
  public isUrlSafeForExtraction(targetUrl: string): boolean {
    try {
      if (!targetUrl || typeof targetUrl !== 'string') return false;
      const trimmed = targetUrl.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return false;
      }

      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      // Check port (standard web ports only)
      if (parsed.port && parsed.port !== '80' && parsed.port !== '443' && parsed.port !== '8080') {
        return false;
      }

      const hostname = parsed.hostname.toLowerCase().trim();

      // Block local/internal hostnames
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname === '[::1]' ||
        hostname === '0' ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.lan') ||
        hostname.endsWith('.corp') ||
        hostname.endsWith('.test') ||
        hostname.endsWith('.example') ||
        hostname.endsWith('.invalid')
      ) {
        return false;
      }

      // Block cloud metadata endpoints
      if (
        hostname === '169.254.169.254' ||
        hostname === 'metadata.google.internal' ||
        hostname === 'metadata.goog' ||
        hostname === '100.100.100.200'
      ) {
        return false;
      }

      // Block private IPv4 ranges
      const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (ipv4Match) {
        const octets = ipv4Match.slice(1).map(Number);
        const [o1, o2, o3, o4] = octets;

        if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return false;

        // 10.0.0.0/8 (Private network)
        if (o1 === 10) return false;
        // 172.16.0.0/12 (Private network)
        if (o1 === 172 && o2 >= 16 && o2 <= 31) return false;
        // 192.168.0.0/16 (Private network)
        if (o1 === 192 && o2 === 168) return false;
        // 169.254.0.0/16 (Link-local / Cloud metadata)
        if (o1 === 169 && o2 === 254) return false;
        // 127.0.0.0/8 (Loopback)
        if (o1 === 127) return false;
        // 0.0.0.0/8
        if (o1 === 0) return false;
        // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
        if (o1 === 100 && o2 >= 64 && o2 <= 127) return false;
        // 198.18.0.0/15 (Network benchmark tests)
        if (o1 === 198 && (o2 === 18 || o2 === 19)) return false;
        // Broadcast
        if (o1 === 255 && o2 === 255 && o3 === 255 && o4 === 255) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitizes raw HTML content for safe, beautiful editorial presentation.
   * Strips scripts, styles, iframes, forms, event handlers while preserving safe headings, paragraphs, and blockquotes.
   */
  public sanitizeHtml(rawHtml: string): string {
    if (!rawHtml) return '';

    return rawHtml
      // Clean CDATA wrappers
      .replace(/<!\[CDATA\[/gi, '')
      .replace(/\]\]>/gi, '')
      // Strip dangerous tags completely
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/<input\b[^>]*>/gi, '')
      .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<meta\b[^>]*>/gi, '')
      .replace(/<link\b[^>]*>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      // Remove inline style, onclick, onload, etc.
      .replace(/\s*style="[^"]*"/gi, '')
      .replace(/\s*on\w+="[^"]*"/gi, '')
      .replace(/\s*id="[^"]*"/gi, '')
      // Remove malicious href/src protocols
      .replace(/\s*href="javascript:[^"]*"/gi, ' href="#"')
      .replace(/\s*src="javascript:[^"]*"/gi, ' src=""')
      // Remove ads and widget containers
      .replace(/<div[^>]*(?:class="[^"]*(?:ad|banner|sponsor|share|social|widget|comment|footer|nav|sidebar)[^"]*")[^>]*>[\s\S]*?<\/div>/gi, '')
      .trim();
  }

  /**
   * Calculates estimated reading time for Arabic text (avg 180 words/min)
   */
  public calculateReadingTime(text: string): { wordCount: number; readingTimeMinutes: number } {
    const plainText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plainText.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));
    return { wordCount, readingTimeMinutes };
  }

  /**
   * Extracts clean structured paragraphs array from text or HTML
   */
  public extractParagraphs(contentOrDescription: string): string[] {
    if (!contentOrDescription) return [];
    const sanitized = this.sanitizeHtml(contentOrDescription);

    // 1. Try extracting actual <p> elements
    const pMatches = sanitized.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);
    if (pMatches && pMatches.length > 0) {
      const extracted = pMatches
        .map((p) => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
        .filter((text) => text.length > 25);
      if (extracted.length > 0) return extracted;
    }

    // 2. Fallback: split by newlines
    const plain = sanitized.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const rawParagraphs = plain.split(/\n\s*\n/);
    if (rawParagraphs.length > 1) {
      const valid = rawParagraphs.map((p) => p.trim()).filter((p) => p.length > 25);
      if (valid.length > 0) return valid;
    }

    // 3. Fallback: If single large block > 350 chars, split by punctuation
    if (plain.length > 350) {
      const sentences = plain.split(/(?<=[.،؛؟\n])\s+/);
      const chunks: string[] = [];
      let currentChunk = '';
      for (const s of sentences) {
        currentChunk += (currentChunk ? ' ' : '') + s;
        if (currentChunk.length >= 220) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
      if (chunks.length > 1) return chunks;
    }

    return plain.length > 0 ? [plain] : [];
  }

  /**
   * Classify content into origin and classification buckets
   */
  public classifyContent(
    content: string | undefined,
    description: string | undefined
  ): { classification: ContentClassification; origin: ContentOrigin } {
    const cleanContent = this.sanitizeHtml(content || '');
    const cleanDesc = this.sanitizeHtml(description || '');

    const contentLen = cleanContent.replace(/<[^>]+>/g, ' ').trim().length;
    const descLen = cleanDesc.replace(/<[^>]+>/g, ' ').trim().length;

    if (contentLen >= 350 && (contentLen > descLen + 100 || descLen === 0)) {
      return {
        classification: 'FULL_PERMITTED_CONTENT',
        origin: 'FULL_FEED',
      };
    }

    if (descLen > 0 || contentLen > 0) {
      return {
        classification: 'FEED_CONTENT',
        origin: 'EXCERPT',
      };
    }

    return {
      classification: 'EXCERPT_ONLY',
      origin: 'EXCERPT',
    };
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
    let score = 30; // base

    if (params.wordCount >= 300) score += 25;
    else if (params.wordCount >= 150) score += 15;
    else if (params.wordCount >= 50) score += 10;

    if (params.paragraphCount >= 4) score += 20;
    else if (params.paragraphCount >= 2) score += 10;

    if (params.hasCoverImage) score += 15;
    if (params.hasAuthor) score += 5;
    if (params.hasPublishedAt) score += 5;

    if (params.classification === 'FULL_PERMITTED_CONTENT') score = Math.min(100, score + 10);
    else if (params.classification === 'EXCERPT_ONLY') score = Math.max(15, score - 15);

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Formats structured paragraphs into clean editorial HTML
   */
  public formatParagraphsToHtml(paragraphs: string[]): string {
    if (!paragraphs || paragraphs.length === 0) return '';
    return paragraphs
      .map((p) => `<p class="leading-relaxed mb-4 text-slate-800 dark:text-slate-200 text-justify text-base sm:text-lg">${p}</p>`)
      .join('\n');
  }

  /**
   * Process raw RSS item content into safe reader format
   */
  public extractFromFeedItem(
    rawContent: string | undefined,
    rawDescription: string | undefined,
    canonicalUrl: string,
    itemMeta?: {
      coverImage?: string;
      author?: string;
      publishedAt?: Date;
    }
  ): ExtractedArticleContent {
    const cleanContent = this.sanitizeHtml(rawContent || '');
    const cleanDescription = this.sanitizeHtml(rawDescription || '');

    const contentText = cleanContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const descText = cleanDescription.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // Check if feed provided full content:encoded distinctly from short summary
    const hasRichContent = Boolean(
      cleanContent &&
      contentText.length >= 350 &&
      (contentText.length > descText.length + 100 || descText.length === 0)
    );

    const paragraphs = hasRichContent
      ? this.extractParagraphs(cleanContent)
      : this.extractParagraphs(cleanDescription || cleanContent);

    const isFull = hasRichContent && (contentText.length >= 350 || paragraphs.length >= 3);
    const summary = descText.length > 20 
      ? descText 
      : (contentText.slice(0, 300) + (contentText.length > 300 ? '...' : ''));

    const formattedBody = this.formatParagraphsToHtml(paragraphs.length > 0 ? paragraphs : [summary]);
    const { wordCount, readingTimeMinutes } = this.calculateReadingTime(formattedBody);

    const classification: ContentClassification = isFull ? 'FULL_PERMITTED_CONTENT' : 'EXCERPT_ONLY';
    const origin: ContentOrigin = isFull ? 'FULL_FEED' : 'EXCERPT';
    const status: ContentStatus = isFull ? 'full' : 'partial';
    const source: ContentSourceType = 'rss';

    const qualityScore = this.calculateQualityScore({
      wordCount,
      paragraphCount: paragraphs.length || 1,
      hasCoverImage: Boolean(itemMeta?.coverImage),
      hasAuthor: Boolean(itemMeta?.author),
      hasPublishedAt: Boolean(itemMeta?.publishedAt),
      contentLength: formattedBody.length,
      classification,
    });

    return {
      title: '',
      formattedBody,
      summary,
      wordCount,
      paragraphCount: paragraphs.length || 1,
      readingTimeMinutes,
      contentClassification: classification,
      contentOrigin: origin,
      contentStatus: status,
      contentSource: source,
      contentQualityScore: qualityScore,
      isFullContentAvailable: isFull,
      canonicalUrl,
      paragraphs,
    };
  }

  /**
   * Multi-Stage Extraction from Article Web Page (HTTP URL)
   * 1. Stage 1: JSON-LD (schema.org NewsArticle / Article / BlogPosting)
   * 2. Stage 2: Semantic HTML & Itemprop articleBody / <article> / <main>
   * 3. Stage 3: OpenGraph metadata fallback
   * 4. Stage 4: Density heuristics (Arabic paragraph clusters)
   * 5. Stage 5: Graceful Excerpt Fallback
   */
  public async extractFromUrl(targetUrl: string, fallbackSummary: string = ''): Promise<ExtractedArticleContent> {
    if (!this.isUrlSafeForExtraction(targetUrl)) {
      return this.buildFallbackResponse(targetUrl, fallbackSummary, 'FAILED_EXTRACTION', 'SSRF_BLOCKED');
    }

    try {
      const response = await httpClientService.fetchWithRetry(targetUrl, {
        timeoutMs: 7000,
        retryAttempts: 1,
      });

      if (!response.ok || !response.body || response.body.length < 100) {
        return this.buildFallbackResponse(targetUrl, fallbackSummary, 'FAILED_EXTRACTION', 'HTTP_ERROR');
      }

      const html = response.body;

      // ========================================================
      // STAGE 1: JSON-LD Extraction
      // ========================================================
      const jsonLdMatch = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatch) {
        for (const scriptTag of jsonLdMatch) {
          try {
            const rawJson = scriptTag.replace(/<script\b[^>]*>|<\/script>/gi, '').trim();
            const data = JSON.parse(rawJson);
            const candidates = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];

            for (const item of candidates) {
              const type = String(item['@type'] || '');
              if (
                type.includes('NewsArticle') ||
                type.includes('Article') ||
                type.includes('BlogPosting') ||
                type.includes('ReportageNewsArticle')
              ) {
                const articleBody = item.articleBody || item.text;
                if (articleBody && typeof articleBody === 'string' && articleBody.trim().length > 250) {
                  const paragraphs = this.extractParagraphs(articleBody);
                  if (paragraphs.length >= 2 || articleBody.trim().length > 350) {
                    const formattedBody = this.formatParagraphsToHtml(paragraphs);
                    const { wordCount, readingTimeMinutes } = this.calculateReadingTime(formattedBody);

                    return {
                      title: item.headline || item.name || '',
                      subheadline: item.description || fallbackSummary,
                      summary: item.description || fallbackSummary || paragraphs[0] || '',
                      formattedBody,
                      wordCount,
                      paragraphCount: paragraphs.length,
                      readingTimeMinutes,
                      contentClassification: 'FULL_PERMITTED_CONTENT',
                      contentOrigin: 'EXTRACTED_PERMITTED',
                      contentStatus: 'full',
                      contentSource: 'extractor',
                      contentQualityScore: 95,
                      isFullContentAvailable: true,
                      canonicalUrl: targetUrl,
                      leadImageUrl: item.image?.url || (typeof item.image === 'string' ? item.image : undefined),
                      authorName: item.author?.name || (typeof item.author === 'string' ? item.author : undefined),
                      publishedAt: item.datePublished ? new Date(item.datePublished) : undefined,
                      paragraphs,
                    };
                  }
                }
              }
            }
          } catch {
            // Ignore JSON parse errors in individual ld+json scripts
          }
        }
      }

      // ========================================================
      // STAGE 2: Semantic HTML & Universal Article Containers
      // ========================================================
      // Common Arabic & international news article containers
      const containerPatterns = [
        /<div\b[^>]*itemprop=["']articleBody["'][^>]*>([\s\S]*?)<\/div>/i,
        /<article\b[^>]*>([\s\S]*?)<\/article>/i,
        /<div\b[^>]*class=["'][^"']*(?:article-body|story-body|entry-content|post-content|article-content|news-content|details-content|content-news|article__content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<section\b[^>]*class=["'][^"']*(?:article-body|story-body|article-content)[^"']*["'][^>]*>([\s\S]*?)<\/section>/i,
        /<main\b[^>]*>([\s\S]*?)<\/main>/i,
      ];

      for (const pattern of containerPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const containerHtml = match[1];
          const paragraphs = this.extractParagraphs(containerHtml);
          const totalLength = paragraphs.join(' ').length;

          if (paragraphs.length >= 2 && totalLength > 300) {
            const formattedBody = this.formatParagraphsToHtml(paragraphs);
            const { wordCount, readingTimeMinutes } = this.calculateReadingTime(formattedBody);

            return {
              title: '',
              formattedBody,
              summary: fallbackSummary || paragraphs[0] || '',
              wordCount,
              paragraphCount: paragraphs.length,
              readingTimeMinutes,
              contentClassification: 'FULL_PERMITTED_CONTENT',
              contentOrigin: 'EXTRACTED_PERMITTED',
              contentStatus: 'full',
              contentSource: 'extractor',
              contentQualityScore: 90,
              isFullContentAvailable: true,
              canonicalUrl: targetUrl,
              paragraphs,
            };
          }
        }
      }

      // ========================================================
      // STAGE 3: Paragraphs Density Heuristic
      // ========================================================
      const allParagraphs = this.extractParagraphs(html);
      // Filter out short navigation/footer snippets, keep significant sentences
      const contentParagraphs = allParagraphs.filter((p) => {
        const arabicChars = (p.match(/[\u0600-\u06FF]/g) || []).length;
        return p.length > 50 && arabicChars > 20;
      });

      if (contentParagraphs.length >= 3) {
        const formattedBody = this.formatParagraphsToHtml(contentParagraphs);
        const { wordCount, readingTimeMinutes } = this.calculateReadingTime(formattedBody);

        return {
          title: '',
          formattedBody,
          summary: fallbackSummary || contentParagraphs[0] || '',
          wordCount,
          paragraphCount: contentParagraphs.length,
          readingTimeMinutes,
          contentClassification: 'FULL_PERMITTED_CONTENT',
          contentOrigin: 'EXTRACTED_PERMITTED',
          contentStatus: 'full',
          contentSource: 'extractor',
          contentQualityScore: 85,
          isFullContentAvailable: true,
          canonicalUrl: targetUrl,
          paragraphs: contentParagraphs,
        };
      }

      // ========================================================
      // STAGE 4: Graceful Excerpt Fallback (No Hallucination)
      // ========================================================
      return this.buildFallbackResponse(targetUrl, fallbackSummary, 'EXCERPT_ONLY', 'EXTRACTION_LIMITED');
    } catch {
      return this.buildFallbackResponse(targetUrl, fallbackSummary, 'FAILED_EXTRACTION', 'FETCH_EXCEPTION');
    }
  }

  private buildFallbackResponse(
    canonicalUrl: string,
    summary: string,
    classification: ContentClassification,
    _reason: string
  ): ExtractedArticleContent {
    const cleanSummary = (summary || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const paragraphs = cleanSummary ? [cleanSummary] : [];
    const formattedBody = this.formatParagraphsToHtml(paragraphs);
    const { wordCount, readingTimeMinutes } = this.calculateReadingTime(cleanSummary);

    return {
      title: '',
      formattedBody,
      summary: cleanSummary,
      wordCount,
      paragraphCount: paragraphs.length,
      readingTimeMinutes,
      contentClassification: classification,
      contentOrigin: 'EXCERPT',
      contentStatus: 'partial',
      contentSource: 'rss',
      contentQualityScore: 60,
      isFullContentAvailable: false,
      canonicalUrl,
      paragraphs,
    };
  }
}

export const contentExtractorService = new ContentExtractorService();
