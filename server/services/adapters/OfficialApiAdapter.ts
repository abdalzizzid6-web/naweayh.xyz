import { SourceAdapter, RawFeedItem } from './SourceAdapter';

export class OfficialApiAdapter extends SourceAdapter {
  public readonly name = 'OfficialApiAdapter';

  public canHandle(sourceType: string, url: string, sampleData?: string): boolean {
    if (sourceType === 'OFFICIAL_API' || sourceType === 'AGENCY_API') return true;
    if (url.includes('/api/') || url.includes('GetNormalNewsBulletin') || url.includes('spa.gov.sa')) return true;
    if (sampleData && (sampleData.trim().startsWith('{') || sampleData.trim().startsWith('['))) {
      return (
        sampleData.includes('"result"') ||
        sampleData.includes('"mainNews"') ||
        sampleData.includes('"news"') ||
        sampleData.includes('"data"')
      );
    }
    return false;
  }

  public parseItems(rawData: string, sourceUrl: string): RawFeedItem[] {
    const items: RawFeedItem[] = [];

    try {
      const data = JSON.parse(rawData);
      const newsList =
        data.result?.data ||
        data.pageProps?.mainNews ||
        data.news ||
        data.data ||
        data.items ||
        (Array.isArray(data.result) ? data.result : []) ||
        (Array.isArray(data) ? data : []);

      for (const item of newsList) {
        const title = (item.title || item.news_title || '').trim();
        let link = item.url || item.news_url || item.link || item.shortenUrl || '';
        if (!link && item.sharable_link) {
          link = item.sharable_link.startsWith('http') ? item.sharable_link : `https://${item.sharable_link}`;
        }
        if (!link && item.uuid && sourceUrl.includes('spa.gov.sa')) {
          link = `https://www.spa.gov.sa/ar/${item.uuid}`;
        }

        const rawSummary = (item.description || item.summary || item.news_summary || item.lead || '').trim();
        const rawContent = (item.body || item.content || item.news_content || rawSummary).trim();
        
        let pubDate =
          item.publishDateTime ||
          item.published_date ||
          item.dateTime ||
          (item.published_at ? new Date(typeof item.published_at === 'number' && item.published_at < 2000000000 ? item.published_at * 1000 : item.published_at).toISOString() : '') ||
          item.created_at ||
          new Date().toISOString();

        const coverImage =
          item.image?.path ||
          (typeof item.image === 'string' ? item.image : undefined) ||
          item.main_image ||
          item.coverImage;

        const categories = [
          item.categoriesDesc,
          item.sectionDesc,
          item.section,
          ...(Array.isArray(item.keywords) ? item.keywords : []),
        ].filter((c): c is string => Boolean(c) && typeof c === 'string');

        if (title && title.length > 3) {
          items.push({
            title,
            link: link || `${sourceUrl}#${item.id || item.uuid || Date.now()}`,
            summary: rawSummary || title,
            content: rawContent || rawSummary || title,
            pubDate,
            author: item.agency || item.source_name || (sourceUrl.includes('qna.org.qa') ? 'وكالة الأنباء القطرية (قنا)' : undefined),
            coverImage,
            categories,
            guid: String(item.guid || item.uuid || item.id || item.news_id || link),
          });
        }
      }
    } catch {}

    return items;
  }
}

export const officialApiAdapter = new OfficialApiAdapter();
