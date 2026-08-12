import { adapterRegistry } from './adapters/AdapterRegistry';
import { httpClientService } from './HttpClientService';

// Prevent regional intermediate SSL certificate errors from blocking feed discovery
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export interface DiscoveredFeed {
  feedUrl: string;
  title: string;
  description: string;
  websiteUrl: string;
  type: 'RSS' | 'ATOM' | 'JSON_API' | 'REST_API';
  logoUrl?: string;
  language: string;
  inferredCountry: string;
  inferredCategory: string;
  reliabilityScore: number;
  responseTimeMs: number;
  articlesCount: number;
  sampleArticles: Array<{
    title: string;
    link: string;
    pubDate?: string;
    description?: string;
  }>;
  verificationPipeline: {
    discovered: boolean;
    validating: boolean;
    connected: boolean;
    fetchTest: boolean;
    contentTest: boolean;
    classification: boolean;
    approved: boolean;
  };
}

export class SourceDiscoveryEngine {
  /**
   * Discovers news feeds from a domain, URL, or RSS feed link.
   */
  public async discoverFromUrl(targetUrl: string): Promise<DiscoveredFeed[]> {
    let normalizedUrl = targetUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const discoveredFeeds: DiscoveredFeed[] = [];

    // 1. First, check if the provided URL itself is a direct RSS/Atom feed
    const directFeed = await this.testAndVerifyFeed(normalizedUrl, normalizedUrl);
    if (directFeed) {
      discoveredFeeds.push(directFeed);
      return discoveredFeeds;
    }

    // 2. If it's a website landing page, fetch HTML and parse <link rel="alternate"> tags
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const html = await response.text();
        const baseDomain = new URL(normalizedUrl).origin;

        // Regex to extract <link rel="alternate" type="application/rss+xml" href="...">
        const feedLinkRegex = /<link[^>]+rel=["']alternate["'][^>]+type=["'](application\/(rss\+xml|atom\+xml|json))["'][^>]+href=["']([^"']+)["']/gi;
        let match;
        const candidateUrls = new Set<string>();

        while ((match = feedLinkRegex.exec(html)) !== null) {
          let href = match[3];
          if (href.startsWith('/')) {
            href = baseDomain + href;
          } else if (!href.startsWith('http')) {
            href = baseDomain + '/' + href;
          }
          candidateUrls.add(href);
        }

        // Also test common fallback RSS paths
        const commonPaths = ['/rss', '/feed', '/rss.xml', '/atom.xml', '/feed.xml', '/index.xml', '/news/rss'];
        for (const path of commonPaths) {
          candidateUrls.add(baseDomain + path);
        }

        // Test candidate URLs
        for (const candidateUrl of candidateUrls) {
          if (discoveredFeeds.some((f) => f.feedUrl === candidateUrl)) continue;
          const feed = await this.testAndVerifyFeed(candidateUrl, normalizedUrl);
          if (feed) {
            discoveredFeeds.push(feed);
            if (discoveredFeeds.length >= 5) break; // Limit candidate discoveries
          }
        }
      }
    } catch (err: any) {
      const isTimeout = err?.name === 'TimeoutError' || err?.message?.includes('timeout') || err?.message?.includes('aborted');
      if (isTimeout) {
        console.log(`[SourceDiscoveryEngine] HTML inspection timed out for ${normalizedUrl}`);
      } else {
        console.warn(`[SourceDiscoveryEngine] HTML inspection notice for ${normalizedUrl}:`, err?.message || err);
      }
    }

    return discoveredFeeds;
  }

  /**
   * Tests an individual feed candidate and executes full verification pipeline stages.
   */
  public async testAndVerifyFeed(feedUrl: string, websiteUrl: string): Promise<DiscoveredFeed | null> {
    const startTime = Date.now();
    const pipeline = {
      discovered: true,
      validating: true,
      connected: false,
      fetchTest: false,
      contentTest: false,
      classification: false,
      approved: false,
    };

    try {
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Naw3iyaNewsBot/2.5 (+https://naweayh.xyz)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, application/json',
        },
        signal: AbortSignal.timeout(7000),
      });

      const responseTimeMs = Date.now() - startTime;

      if (!response.ok) return null;
      pipeline.connected = true;

      const text = await response.text();
      pipeline.fetchTest = true;

      // Parse XML / RSS / Atom
      const parsed = adapterRegistry.parseWithBestAdapter(text, 'RSS', feedUrl);
      const items = parsed.items;
      if (!items || items.length === 0) return null;
      pipeline.contentTest = true;

      // Infer feed attributes
      const sampleArticles = items.slice(0, 5).map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: typeof item.pubDate === 'string' ? item.pubDate : item.pubDate?.toISOString(),
        description: item.summary?.slice(0, 150),
      }));

      // Extract feed title/description using basic regex if available
      const titleMatch = text.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
      const feedTitle = titleMatch ? titleMatch[1].trim() : new URL(feedUrl).hostname;

      const descMatch = text.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i);
      const feedDesc = descMatch ? descMatch[1].trim() : 'مصدر إخباري تم اكتشافه آلياً';

      const inferredCategory = this.inferCategory(feedTitle + ' ' + feedDesc + ' ' + sampleArticles[0]?.title);
      const inferredCountry = this.inferCountry(feedUrl + ' ' + feedTitle);
      const language = /[أ-ي]/.test(feedTitle + sampleArticles[0]?.title) ? 'ar' : 'en';

      pipeline.classification = true;
      pipeline.approved = true;

      return {
        feedUrl,
        websiteUrl: websiteUrl || new URL(feedUrl).origin,
        title: feedTitle,
        description: feedDesc,
        type: feedUrl.includes('json') ? 'JSON_API' : 'RSS',
        language,
        inferredCategory,
        inferredCountry,
        reliabilityScore: 85,
        responseTimeMs,
        articlesCount: items.length,
        sampleArticles,
        verificationPipeline: pipeline,
      };
    } catch {
      return null;
    }
  }

  /**
   * Helper to parse OPML (Outline Processor Markup Language) XML content for bulk feed imports.
   */
  public parseOPML(opmlXmlContent: string): Array<{ name: string; feedUrl: string; category?: string }> {
    const feeds: Array<{ name: string; feedUrl: string; category?: string }> = [];
    const outlineRegex = /<outline[^>]+(?:xmlUrl|htmlUrl)=["']([^"']+)["'][^>]*>/gi;
    const titleRegex = /title=["']([^"']+)["']/i;
    const textRegex = /text=["']([^"']+)["']/i;
    const categoryRegex = /category=["']([^"']+)["']/i;

    let match;
    while ((match = outlineRegex.exec(opmlXmlContent)) !== null) {
      const fullTag = match[0];
      const feedUrl = match[1];

      if (feedUrl && feedUrl.startsWith('http')) {
        const titleMatch = fullTag.match(titleRegex) || fullTag.match(textRegex);
        const categoryMatch = fullTag.match(categoryRegex);

        feeds.push({
          name: titleMatch ? titleMatch[1] : new URL(feedUrl).hostname,
          feedUrl,
          category: categoryMatch ? categoryMatch[1] : undefined,
        });
      }
    }

    return feeds;
  }

  /**
   * Infer category from Arabic/English text heuristics.
   */
  private inferCategory(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('رياضة') || lower.includes('كرة') || lower.includes('sport')) return 'رياضة';
    if (lower.includes('اقتصاد') || lower.includes('مال') || lower.includes('business') || lower.includes('market')) return 'اقتصاد';
    if (lower.includes('تقنية') || lower.includes('تكنولوجيا') || lower.includes('tech') || lower.includes('software')) return 'تقنية';
    if (lower.includes('صحة') || lower.includes('طب') || lower.includes('health')) return 'صحة';
    if (lower.includes('منوعات') || lower.includes('ثقافة') || lower.includes('فن')) return 'منوعات';
    return 'سياسة';
  }

  /**
   * Infer country from URL TLD or text heuristic.
   */
  private inferCountry(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('.ye') || lower.includes('اليمن') || lower.includes('yemen')) return 'اليمن';
    if (lower.includes('.sa') || lower.includes('السعودية') || lower.includes('saudi')) return 'السعودية';
    if (lower.includes('.ae') || lower.includes('الإمارات') || lower.includes('uae')) return 'الإمارات';
    if (lower.includes('.qa') || lower.includes('قطر') || lower.includes('qatar')) return 'قطر';
    if (lower.includes('.kw') || lower.includes('الكويت') || lower.includes('kuwait')) return 'الكويت';
    if (lower.includes('.eg') || lower.includes('مصر') || lower.includes('egypt')) return 'مصر';
    if (lower.includes('.om') || lower.includes('عمان') || lower.includes('oman')) return 'عُمان';
    if (lower.includes('.bh') || lower.includes('البحرين') || lower.includes('bahrain')) return 'البحرين';
    if (lower.includes('.iq') || lower.includes('العراق') || lower.includes('iraq')) return 'العراق';
    if (lower.includes('.jo') || lower.includes('الأردن') || lower.includes('jordan')) return 'الأردن';
    if (lower.includes('.ps') || lower.includes('فلسطين') || lower.includes('palestine')) return 'فلسطين';
    if (lower.includes('.lb') || lower.includes('لبنان') || lower.includes('lebanon')) return 'لبنان';
    if (lower.includes('.ma') || lower.includes('المغرب') || lower.includes('morocco')) return 'المغرب';
    return 'عالمي';
  }
}

export const sourceDiscoveryEngine = new SourceDiscoveryEngine();
