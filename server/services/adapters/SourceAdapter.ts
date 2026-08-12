export interface RawFeedItem {
  title: string;
  link: string;
  summary?: string;
  content?: string;
  pubDate?: Date | string;
  author?: string;
  coverImage?: string;
  categories?: string[];
  guid?: string;
}

export interface AdapterFetchResult {
  rawData: string;
  items: RawFeedItem[];
  finalUrl: string;
  responseTimeMs: number;
  adapterName: string;
}

export abstract class SourceAdapter {
  public abstract readonly name: string;

  /**
   * Determine if this adapter handles the target source config or raw body
   */
  public abstract canHandle(sourceType: string, url: string, sampleData?: string): boolean;

  /**
   * Parse items from raw text or JSON string
   */
  public abstract parseItems(rawData: string, sourceUrl: string): RawFeedItem[];
}
