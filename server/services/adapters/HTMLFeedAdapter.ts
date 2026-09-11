import { SourceAdapter, RawFeedItem } from './SourceAdapter';

export class HTMLFeedAdapter extends SourceAdapter {
  public readonly name = 'HTMLFeedAdapter';

  public canHandle(sourceType: string, url: string, sampleData?: string): boolean {
    if (sourceType === 'HTML_SCRAPE' || sourceType === 'HTML') return true;
    if (sampleData) {
      return sampleData.includes('<!DOCTYPE html') || sampleData.includes('<html');
    }
    return !url.endsWith('.xml') && !url.endsWith('.json');
  }

  public parseItems(rawData: string, sourceUrl: string): RawFeedItem[] {
    const items: RawFeedItem[] = [];

    // 1. Attempt to extract from __NEXT_DATA__ JSON script if present (SPA, Next.js portals)
    try {
      const nextDataMatch = rawData.match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
      if (nextDataMatch && nextDataMatch[1]) {
        const nextJson = JSON.parse(nextDataMatch[1]);
        const mainNews =
          nextJson.props?.pageProps?.mainNews ||
          nextJson.props?.pageProps?.news ||
          nextJson.props?.pageProps?.articles ||
          nextJson.pageProps?.mainNews ||
          [];

        if (Array.isArray(mainNews) && mainNews.length > 0) {
          for (const item of mainNews) {
            const title = (item.title || item.news_title || '').trim();
            let link = item.url || item.sharable_link || item.link || '';
            if (link && !link.startsWith('http')) {
              link = `https://${link.replace(/^\/+/, '')}`;
            }
            if (!link && item.uuid) {
              const origin = new URL(sourceUrl).origin;
              link = `${origin}/ar/${item.uuid}`;
            }

            const pubDate = item.published_at
              ? new Date(typeof item.published_at === 'number' && item.published_at < 2000000000 ? item.published_at * 1000 : item.published_at).toISOString()
              : item.created_at || new Date().toISOString();

            const coverImage = item.image?.path || (typeof item.image === 'string' ? item.image : undefined);

            if (title && title.length > 3) {
              items.push({
                title,
                link: link || `${sourceUrl}#${item.uuid || item.id || Date.now()}`,
                summary: (item.subtitle || title).trim(),
                content: (item.content || item.subtitle || title).trim(),
                pubDate,
                coverImage,
                guid: String(item.uuid || item.id || link),
              });
            }
          }
          if (items.length > 0) return items;
        }
      }
    } catch {}

    // 2. Fallback to HTML anchor tag parsing
    try {
      const baseOrigin = new URL(sourceUrl).origin;
      const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
      let match;
      const seenLinks = new Set<string>();

      while ((match = linkRegex.exec(rawData)) !== null) {
        let href = match[1];
        const rawTitle = match[2].replace(/<[^>]+>/g, '').trim();

        if (href.startsWith('/')) {
          href = baseOrigin + href;
        } else if (!href.startsWith('http')) {
          href = baseOrigin + '/' + href;
        }

        if (rawTitle.length > 18 && !seenLinks.has(href) && /[أ-ي]/.test(rawTitle)) {
          seenLinks.add(href);
          items.push({
            title: rawTitle,
            link: href,
            summary: rawTitle,
            content: rawTitle,
            pubDate: new Date().toISOString(),
            guid: href,
          });
          if (items.length >= 20) break;
        }
      }
    } catch {}

    return items;
  }
}

export const htmlFeedAdapter = new HTMLFeedAdapter();
