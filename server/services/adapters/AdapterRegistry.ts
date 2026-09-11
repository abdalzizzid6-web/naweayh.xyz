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
    const primaryAdapter = this.selectAdapter(sourceType, url, rawData);
    const items = primaryAdapter.parseItems(rawData, url);
    if (items.length > 0) {
      return { items, adapterUsed: primaryAdapter.name };
    }

    // Fallback: test other registered adapters if primary produced 0 items
    for (const altAdapter of this.adapters) {
      if (altAdapter === primaryAdapter) continue;
      try {
        const altItems = altAdapter.parseItems(rawData, url);
        if (altItems.length > 0) {
          return { items: altItems, adapterUsed: altAdapter.name };
        }
      } catch {}
    }

    return { items: [], adapterUsed: primaryAdapter.name };
  }
}

export const adapterRegistry = new AdapterRegistry();
