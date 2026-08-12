import { XMLParser } from 'fast-xml-parser';
import { SourceAdapter, RawFeedItem } from './SourceAdapter';

export class AtomAdapter extends SourceAdapter {
  public readonly name = 'AtomAdapter';
  private parser: XMLParser;

  constructor() {
    super();
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: false,
      trimValues: true,
      maxNestedTags: 1000,
    });
  }

  public canHandle(sourceType: string, url: string, sampleData?: string): boolean {
    if (sourceType === 'Atom' || sourceType === 'ATOM') return true;
    if (sampleData) {
      return sampleData.includes('<feed') && sampleData.includes('xmlns="http://www.w3.org/2005/Atom"');
    }
    return url.includes('atom') || url.endsWith('.atom');
  }

  public parseItems(rawData: string, _sourceUrl: string): RawFeedItem[] {
    const items: RawFeedItem[] = [];

    try {
      const jsonObj = this.parser.parse(rawData);
      const feed = jsonObj?.feed;
      if (!feed) return items;

      const entries = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : [];

      for (const entry of entries) {
        const title = this.extractText(entry.title);
        const link = this.extractLink(entry.link);
        const summary = this.cleanHtml(this.extractText(entry.summary || entry.subtitle));
        const content = this.cleanHtml(this.extractText(entry.content || summary));
        const pubDate = this.extractText(entry.published || entry.updated) || new Date().toISOString();
        const author = this.extractText(entry.author?.name || entry.author);
        const coverImage = this.extractImage(entry);

        if (title && title.length > 3) {
          items.push({
            title,
            link,
            summary,
            content: content || summary,
            pubDate,
            author,
            coverImage,
            guid: link,
          });
        }
      }
    } catch {}

    return items;
  }

  private extractText(node: any): string {
    if (!node) return '';
    if (typeof node === 'string') return node.trim();
    if (typeof node === 'number') return String(node);
    if (node['#text']) return String(node['#text']).trim();
    if (node['#cdata']) return String(node['#cdata']).trim();
    return '';
  }

  private extractLink(linkNode: any): string {
    if (!linkNode) return '';
    if (typeof linkNode === 'string') return linkNode.trim();
    if (linkNode['@_href']) return String(linkNode['@_href']).trim();
    if (Array.isArray(linkNode)) {
      const alt = linkNode.find((l: any) => l['@_rel'] === 'alternate' || !l['@_rel']);
      if (alt) return this.extractLink(alt);
    }
    return '';
  }

  private extractImage(entryNode: any): string | undefined {
    if (entryNode?.['media:content']?.['@_url']) return entryNode['media:content']['@_url'];
    if (entryNode?.['media:thumbnail']?.['@_url']) return entryNode['media:thumbnail']['@_url'];
    const desc = this.extractText(entryNode.content) || this.extractText(entryNode.summary);
    const match = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : undefined;
  }

  private cleanHtml(str: string): string {
    if (!str) return '';
    return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export const atomAdapter = new AtomAdapter();
