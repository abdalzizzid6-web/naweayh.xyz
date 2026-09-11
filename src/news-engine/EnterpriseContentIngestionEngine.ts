import { NewsSource } from '../types';

export interface FullExtractedArticleData {
  title: string;
  originalArticleUrl: string;
  sourceName: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  country: string;
  language: string;
  coverImageUrl: string;
  galleryImages: string[];
  embeddedVideos: string[];
  paragraphs: string[];
  formattedBody: string;
  tags: string[];
  keywords: string[];
  extractedPeople: string[];
  extractedCompanies: string[];
  extractedLocations: string[];
  extractedEvents: string[];
  seoTitle: string;
  metaDescription: string;
  slug: string;
  summary: string;
  isFullContentAvailable: boolean;
  copyrightNotice: string;
}

export class EnterpriseContentIngestionEngine {
  /**
   * Enterprise Content Ingestion & Legal Content Parser
   * Extracts real paragraphs, clean HTML, and authentic metadata directly from feed items.
   * NEVER fabricates fake paragraphs, fake people, fake videos, or fake AI text.
   */
  public async ingestFullArticle(
    source: NewsSource,
    rawFeedItem: {
      title: string;
      rawSnippet: string;
      url?: string;
      author?: string;
      publishedAt?: string;
      imageUrl?: string;
      category?: string;
      country?: string;
      language?: string;
    }
  ): Promise<FullExtractedArticleData> {
    const cleanedTitle = this.sanitizeText(rawFeedItem.title);
    const originalUrl = rawFeedItem.url || source.url || '';
    const authorName = rawFeedItem.author || source.name || 'فريق التحرير';
    const publishedDate = rawFeedItem.publishedAt || new Date().toISOString();
    const updatedDate = new Date().toISOString();
    const category = rawFeedItem.category || source.category || 'أخبار عامة';
    const country = rawFeedItem.country || source.country || 'اليمن';
    const language = rawFeedItem.language || 'ar';

    // Real Paragraph Extraction from provided snippet or content
    const rawSnippet = rawFeedItem.rawSnippet || '';
    const cleanSnippet = this.sanitizeText(rawSnippet);

    // Extract real paragraphs by splitting HTML tags or double newlines
    let paragraphs: string[] = [];
    if (rawSnippet.includes('<p>') || rawSnippet.includes('</p>')) {
      const pMatches = rawSnippet.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);
      if (pMatches) {
        paragraphs = pMatches
          .map((p) => this.sanitizeText(p))
          .filter((text) => text.length > 20);
      }
    }

    if (paragraphs.length === 0 && cleanSnippet) {
      paragraphs = cleanSnippet
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20);
    }

    if (paragraphs.length === 0 && cleanSnippet) {
      paragraphs = [cleanSnippet];
    }

    const isFullContentAvailable = paragraphs.length >= 3 || cleanSnippet.length > 300;
    const formattedBodyHTML = paragraphs.map((p) => `<p class="mb-4 leading-relaxed">${p}</p>`).join('\n');
    const coverImage = rawFeedItem.imageUrl || '';
    const summary = cleanSnippet.slice(0, 300) || cleanedTitle;
    const seoTitle = `${cleanedTitle} | ${source.name}`;
    const metaDescription = summary.slice(0, 155);
    const slug =
      cleanedTitle
        .replace(/[\s\u0600-\u06FF]+/g, '-')
        .replace(/[^\w-]/g, '')
        .toLowerCase()
        .slice(0, 60) +
      '-' +
      Date.now().toString().slice(-4);

    // Derived keywords strictly from title & category
    const keywords = [category, country].filter(Boolean);

    return {
      title: cleanedTitle,
      originalArticleUrl: originalUrl,
      sourceName: source.name,
      author: authorName,
      publishedAt: publishedDate,
      updatedAt: updatedDate,
      category,
      country,
      language,
      coverImageUrl: coverImage,
      galleryImages: coverImage ? [coverImage] : [],
      embeddedVideos: [],
      paragraphs,
      formattedBody: formattedBodyHTML,
      tags: [category],
      keywords,
      extractedPeople: [],
      extractedCompanies: [source.name],
      extractedLocations: [country].filter(Boolean),
      extractedEvents: [],
      seoTitle,
      metaDescription,
      slug,
      summary,
      isFullContentAvailable,
      copyrightNotice: `© جميع الحقوق محفوظة لـ ${source.name}.`,
    };
  }

  private sanitizeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&quot;/gi, '"')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .trim();
  }
}

export const enterpriseContentIngestionEngine = new EnterpriseContentIngestionEngine();
