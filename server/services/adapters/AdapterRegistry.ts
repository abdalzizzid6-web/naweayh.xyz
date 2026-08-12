import { SourceAdapter, RawFeedItem } from './SourceAdapter';
import { rssAdapter } from './RSSAdapter';
import { atomAdapter } from './AtomAdapter';
import { jsonFeedAdapter } from './JsonFeedAdapter';
import { restApiAdapter } from './RestApiAdapter';
import { officialApiAdapter } from './OfficialApiAdapter';
import { htmlFeedAdapter } from './HTMLFeedAdapter';

export class AdapterRegistry {
  private adapters: SourceAdapter[] = [];

  constructor() {
    this.register(rssAdapter);
    this.register(atomAdapter);
    this.register(jsonFeedAdapter);
    this.register(restApiAdapter);
    this.register(officialApiAdapter);
    this.register(htmlFeedAdapter);
  }

  public register(adapter: SourceAdapter): void {
    this.adapters.push(adapter);
  }

  /**
   * Find suitable adapter for a source
   */
  public selectAdapter(sourceType: string, url: string, sampleData?: string): SourceAdapter {
    for (const adapter of this.adapters) {
      if (adapter.canHandle(sourceType, url, sampleData)) {
        return adapter;
      }
    }
    // Fallback to RSS adapter
    return rssAdapter;
  }

  public parseWithBestAdapter(
    rawData: string,
    sourceType: string,
    url: string
  ): { items: RawFeedItem[]; adapterUsed: string } {
    const adapter = this.selectAdapter(sourceType, url, rawData);
    const items = adapter.parseItems(rawData, url);
    return { items, adapterUsed: adapter.name };
  }
}

export const adapterRegistry = new AdapterRegistry();
