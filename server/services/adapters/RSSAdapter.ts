import { XMLParser } from 'fast-xml-parser';
import { SourceAdapter, RawFeedItem } from './SourceAdapter';

export interface ParsedFeedItem {
  title: string;
  link: string;
  description: string;
  content?: string;
  pubDate: string;
  author?: string;
  imageUrl?: string;
  category?: string;
  guid?: string;
}

export class RSSAdapter extends SourceAdapter {
  public readonly name = 'RSSAdapter';
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
    if (sourceType === 'RSS') return true;
    if (sampleData) {
      return sampleData.includes('<rss') || sampleData.includes('<channel');
    }
    return url.includes('rss') || url.endsWith('.xml');
  }

  public parseItems(rawData: string, _sourceUrl: string): RawFeedItem[] {
    const parsed = this.parseXML(rawData);
    return parsed.map((item) => ({
      title: item.title,
      link: item.link,
      summary: item.description,
      content: item.content,
      pubDate: item.pubDate,
      author: item.author,
      coverImage: item.imageUrl,
      categories: item.category ? [item.category] : [],
      guid: item.guid,
    }));
  }

  /**
   * Parses RSS 2.0, Atom, or XML feed strings using fast-xml-parser
   * with robust fallback for non-standard XML structures.
   */
  public parseXML(xmlString: string): ParsedFeedItem[] {
    const items: ParsedFeedItem[] = [];

    try {
      const jsonObj = this.parser.parse(xmlString);

      // 1. Standard RSS 2.0 channel -> item
      const channel = jsonObj?.rss?.channel || jsonObj?.channel;
      if (channel) {
        const rawItems = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
        for (const item of rawItems) {
          const title = this.cleanHtml(this.extractText(item.title));
          const link = this.extractLink(item.link);
          const rawDescription = this.extractText(item.description || item.summary);
          const description = this.cleanHtml(rawDescription);
          
          const rawEncoded = this.extractText(item['content:encoded'] || item.content);
          const content = rawEncoded && rawEncoded.trim().length > 50 ? rawEncoded.trim() : undefined;
          
          const pubDate = this.extractText(item.pubDate || item.published || item['dc:date']) || new Date().toISOString();
          const author = this.extractText(item['dc:creator'] || item.author) || undefined;
          const imageUrl = this.extractImageUrl(item);
          const category = this.extractText(item.category) || undefined;
          const guid = this.extractText(item.guid) || link;

          if (title && title.length > 3) {
            items.push({
              title,
              link,
              description: description || title,
              content,
              pubDate,
              author,
              imageUrl,
              category,
              guid,
            });
          }
        }
        if (items.length > 0) return items;
      }

      // 2. Atom 1.0 feed -> entry
      const feed = jsonObj?.feed;
      if (feed) {
        const rawEntries = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : [];
        for (const entry of rawEntries) {
          const title = this.cleanHtml(this.extractText(entry.title));
          const link = this.extractLink(entry.link);
          const rawDescription = this.extractText(entry.summary || entry.description);
          const description = this.cleanHtml(rawDescription);
          
          const rawContent = this.extractText(entry.content);
          const content = rawContent && rawContent.trim().length > 50 ? rawContent.trim() : undefined;
          
          const pubDate = this.extractText(entry.published || entry.updated) || new Date().toISOString();
          const author = this.extractText(entry.author?.name || entry.author) || undefined;
          const imageUrl = this.extractImageUrl(entry);
          const category = this.extractText(entry.category?.['@_term'] || entry.category) || undefined;

          if (title && title.length > 3) {
            items.push({
              title,
              link,
              description: description || title,
              content,
              pubDate,
              author,
              imageUrl,
              category,
              guid: link,
            });
          }
        }
        if (items.length > 0) return items;
      }
    } catch (err: any) {
      console.warn('[RSSAdapter] fast-xml-parser notice, running regex fallback parser:', err?.message || err);
    }

    // 3. Fallback Regex Parsing
    return this.fallbackRegexParse(xmlString);
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
    if (linkNode['#text']) return String(linkNode['#text']).trim();
    if (Array.isArray(linkNode)) {
      const alternate = linkNode.find((l: any) => l['@_rel'] === 'alternate' || !l['@_rel']);
      if (alternate) return this.extractLink(alternate);
    }
    return '';
  }

  private extractImageUrl(itemNode: any): string | undefined {
    if (itemNode?.['media:content']?.['@_url']) return itemNode['media:content']['@_url'];
    if (itemNode?.['media:thumbnail']?.['@_url']) return itemNode['media:thumbnail']['@_url'];
    if (itemNode?.enclosure?.['@_url'] && itemNode.enclosure['@_type']?.startsWith('image')) {
      return itemNode.enclosure['@_url'];
    }
    
    // Look for <img> tags in description or content
    const desc = this.extractText(itemNode.description) || this.extractText(itemNode['content:encoded']);
    const match = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) return match[1];

    return undefined;
  }

  private cleanHtml(htmlStr: string): string {
    if (!htmlStr) return '';
    return htmlStr
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private fallbackRegexParse(xmlString: string): ParsedFeedItem[] {
    const items: ParsedFeedItem[] = [];
    const itemMatches = xmlString.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];

    for (const itemXml of itemMatches) {
      const titleMatch = itemXml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i) || itemXml.match(/href=["']([^"']+)["']/i);
      const descMatch = itemXml.match(/<description\b[^>]*>([\s\S]*?)<\/description>/i) || itemXml.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
      const contentMatch = itemXml.match(/<content:encoded\b[^>]*>([\s\S]*?)<\/content:encoded>/i) || itemXml.match(/<content\b[^>]*>([\s\S]*?)<\/content>/i);
      const pubDateMatch = itemXml.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i) || itemXml.match(/<published\b[^>]*>([\s\S]*?)<\/published>/i);
      const imgMatch = itemXml.match(/url=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["']/i) || itemXml.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["']/i);

      if (titleMatch) {
        let title = this.cleanHtml(titleMatch[1]);
        title = title.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
        
        let link = linkMatch ? linkMatch[1].trim() : '';
        link = link.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
        
        const description = descMatch ? this.cleanHtml(descMatch[1]) : title;
        const rawContent = contentMatch ? contentMatch[1].trim() : undefined;
        const content = rawContent && rawContent.length > 50 ? rawContent : undefined;
        const pubDate = pubDateMatch ? this.cleanHtml(pubDateMatch[1]) : new Date().toISOString();
        const imageUrl = imgMatch ? imgMatch[1].trim() : undefined;

        if (title.length > 3) {
          items.push({
            title,
            link,
            description,
            content,
            pubDate,
            imageUrl,
          });
        }
      }
    }
    return items;
  }
}

export const rssAdapter = new RSSAdapter();
