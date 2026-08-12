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
