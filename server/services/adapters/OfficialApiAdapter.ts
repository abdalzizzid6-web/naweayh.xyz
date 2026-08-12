import { SourceAdapter, RawFeedItem } from './SourceAdapter';

export class OfficialApiAdapter extends SourceAdapter {
  public readonly name = 'OfficialApiAdapter';

  public canHandle(sourceType: string, _url: string, _sampleData?: string): boolean {
    return sourceType === 'OFFICIAL_API' || sourceType === 'AGENCY_API';
  }

  public parseItems(rawData: string, _sourceUrl: string): RawFeedItem[] {
    const items: RawFeedItem[] = [];

    try {
      const data = JSON.parse(rawData);
      const newsList = data.news || data.data || data.items || [];

      for (const item of newsList) {
        const title = (item.title || item.news_title || '').trim();
        const link = item.news_url || item.url || item.link || '';
        const summary = (item.summary || item.news_summary || item.lead || '').trim();
        const content = (item.content || item.news_content || summary).trim();
        const pubDate = item.published_date || item.created_at || new Date().toISOString();

        if (title && title.length > 3) {
          items.push({
            title,
            link,
            summary,
            content,
            pubDate,
            author: item.agency || item.source_name,
            coverImage: item.main_image || item.image,
            guid: String(item.news_id || link),
          });
        }
      }
    } catch {}

    return items;
  }
}

export const officialApiAdapter = new OfficialApiAdapter();
