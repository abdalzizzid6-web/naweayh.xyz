import { SourceAdapter, RawFeedItem } from './SourceAdapter';

export class RestApiAdapter extends SourceAdapter {
  public readonly name = 'RestApiAdapter';

  public canHandle(sourceType: string, url: string, _sampleData?: string): boolean {
    if (sourceType === 'REST_API' || sourceType === 'REST') return true;
    return url.includes('/api/v') || url.includes('/v1/news') || url.includes('/articles.json');
  }

  public parseItems(rawData: string, _sourceUrl: string): RawFeedItem[] {
    const items: RawFeedItem[] = [];

    try {
      const data = JSON.parse(rawData);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.articles)
        ? data.articles
        : Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.items)
        ? data.items
        : [];

      for (const item of list) {
        const title = (item.title || item.headline || item.name || '').trim();
        const link = item.url || item.link || item.originalUrl || item.permalink || '';
        const summary = this.cleanHtml(item.summary || item.description || item.excerpt || '');
        const content = this.cleanHtml(item.content || item.body || summary);
        const pubDate = item.publishedAt || item.publishDate || item.published_at || item.created_at || new Date().toISOString();
        const author = item.author || item.editor;
        const coverImage = item.imageUrl || item.image || item.coverImage || item.thumbnail;

        if (title && title.length > 3) {
          items.push({
            title,
            link,
            summary,
            content: content || summary,
            pubDate,
            author,
            coverImage,
            guid: String(item.id || item.guid || link),
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

export const restApiAdapter = new RestApiAdapter();
