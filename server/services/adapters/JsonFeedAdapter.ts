import { SourceAdapter, RawFeedItem } from './SourceAdapter';

export class JsonFeedAdapter extends SourceAdapter {
  public readonly name = 'JsonFeedAdapter';

  public canHandle(sourceType: string, url: string, sampleData?: string): boolean {
    if (sourceType === 'JSON' || sourceType === 'JSONFeed') return true;
    if (sampleData) {
      return sampleData.includes('https://jsonfeed.org/version/') || sampleData.includes('"version": "https://jsonfeed.org/version');
    }
    return url.includes('jsonfeed') || url.endsWith('.json');
  }

  public parseItems(rawData: string, _sourceUrl: string): RawFeedItem[] {
    const items: RawFeedItem[] = [];

    try {
      const data = JSON.parse(rawData);
      const rawItems = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];

      for (const item of rawItems) {
        const title = (item.title || '').trim();
        const link = item.url || item.external_url || item.link || '';
        const summary = this.cleanHtml(item.summary || item.excerpt || '');
        const content = this.cleanHtml(item.content_text || item.content_html || summary);
        const pubDate = item.date_published || item.date_modified || new Date().toISOString();
        const author = item.author?.name || (typeof item.author === 'string' ? item.author : undefined);
        const coverImage = item.image || item.banner_image;

        if (title && title.length > 3) {
          items.push({
            title,
            link,
            summary,
            content: content || summary,
            pubDate,
            author,
            coverImage,
            guid: item.id || link,
          });
        }
      }
    } catch {}

    return items;
  }

  private cleanHtml(str: string): string {
    if (!str) return '';
    return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export const jsonFeedAdapter = new JsonFeedAdapter();
