import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

/**
 * Checks if an IPv4 address belongs to private, loopback, link-local, or reserved ranges.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // invalid format considered dangerous
  }

  const [o1, o2, o3, o4] = parts;

  // 0.0.0.0/8 (Current network)
  if (o1 === 0) return true;
  // 10.0.0.0/8 (Private)
  if (o1 === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (o1 === 127) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata AWS/GCP/Azure)
  if (o1 === 169 && o2 === 254) return true;
  // 172.16.0.0/12 (Private)
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (o1 === 192 && o2 === 168) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (o1 === 198 && (o2 === 18 || o2 === 19)) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (o1 === 192 && o2 === 0 && o3 === 0) return true;
  // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation)
  if (o1 === 192 && o2 === 0 && o3 === 2) return true;
  if (o1 === 198 && o2 === 51 && o3 === 100) return true;
  if (o1 === 203 && o2 === 0 && o3 === 113) return true;
  // 224.0.0.0/4 (Multicast)
  if (o1 >= 224 && o1 <= 239) return true;
  // 240.0.0.0/4 (Reserved)
  if (o1 >= 240) return true;
  // 255.255.255.255 (Broadcast)
  if (o1 === 255 && o2 === 255 && o3 === 255 && o4 === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 address belongs to loopback, link-local, unique-local, or IPv4-mapped private ranges.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // Loopback ::1 or unspecified ::
  if (normalized === '::1' || normalized === '::' || normalized === '0:0:0:0:0:0:0:1' || normalized === '0:0:0:0:0:0:0:0') {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.replace('::ffff:', '');
    return isPrivateIPv4(v4Part);
  }

  // Unique local addresses fc00::/7 (fc00... or fd00...)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  // Link-local unicast fe80::/10
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true;
  }

  // Multicast ff00::/8
  if (normalized.startsWith('ff')) {
    return true;
  }

  // Documentation 2001:db8::/32
  if (normalized.startsWith('2001:db8:') || normalized.startsWith('2001:0db8:')) {
    return true;
  }

  return false;
}

export const SafeUrlService = {
  /**
   * Fast static validation of URL scheme, port, hostname, and metadata endpoints.
   */
  isSyntacticallySafe(targetUrl: string): { safe: boolean; reason?: string; urlObj?: URL } {
    try {
      if (!targetUrl || typeof targetUrl !== 'string') {
        return { safe: false, reason: 'Invalid or empty URL string' };
      }

      const trimmed = targetUrl.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return { safe: false, reason: 'Only HTTP and HTTPS protocols are permitted' };
      }

      const parsed = new URL(trimmed);

      // Only standard web ports
      if (parsed.port && parsed.port !== '80' && parsed.port !== '443' && parsed.port !== '8080') {
        return { safe: false, reason: `Port ${parsed.port} is blocked for security` };
      }

      const hostname = parsed.hostname.toLowerCase().trim();

      // Block common loopback / internal hostnames
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname === '[::1]' ||
        hostname === '0' ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.lan') ||
        hostname.endsWith('.corp') ||
        hostname.endsWith('.test') ||
        hostname.endsWith('.example') ||
        hostname.endsWith('.invalid')
      ) {
        return { safe: false, reason: 'Internal/localhost hostnames are strictly blocked' };
      }

      // Block known cloud metadata endpoints
      if (
        hostname === '169.254.169.254' ||
        hostname === 'metadata.google.internal' ||
        hostname === 'metadata.goog' ||
        hostname === '100.100.100.200' ||
        hostname === 'instance-data'
      ) {
        return { safe: false, reason: 'Cloud instance metadata endpoints are strictly blocked' };
      }

      // Check if hostname is direct IP literal
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        if (isPrivateIPv4(hostname)) {
          return { safe: false, reason: 'Private or reserved IPv4 addresses are strictly blocked' };
        }
      }

      if (hostname.includes(':')) {
        const cleanIpv6 = hostname.replace(/^\[|\]$/g, '');
        if (isPrivateIPv6(cleanIpv6)) {
          return { safe: false, reason: 'Private or reserved IPv6 addresses are strictly blocked' };
        }
      }

      return { safe: true, urlObj: parsed };
    } catch (err: any) {
      return { safe: false, reason: `URL parsing failed: ${err.message}` };
    }
  },

  /**
   * Performs DNS resolution and verifies all resolved IP addresses are public and safe (SSRF & DNS rebinding protection).
   */
  async verifyDnsAndIpSafety(targetUrl: string): Promise<{ safe: boolean; reason?: string; resolvedIps?: string[] }> {
    const syntax = SafeUrlService.isSyntacticallySafe(targetUrl);
    if (!syntax.safe || !syntax.urlObj) {
      return { safe: false, reason: syntax.reason };
    }

    const hostname = syntax.urlObj.hostname;

    try {
      // Resolve both IPv4 and IPv6
      const results = await dnsLookup(hostname, { all: true });
      if (!results || results.length === 0) {
        return { safe: false, reason: 'DNS resolution returned no addresses' };
      }

      const resolvedIps = results.map(r => r.address);

      for (const res of results) {
        const ip = res.address;
        if (res.family === 4) {
          if (isPrivateIPv4(ip)) {
            return { safe: false, reason: `SSRF Blocked: Hostname resolved to private IPv4 ${ip}` };
          }
        } else if (res.family === 6) {
          if (isPrivateIPv6(ip)) {
            return { safe: false, reason: `SSRF Blocked: Hostname resolved to private IPv6 ${ip}` };
          }
        }
      }

      return { safe: true, resolvedIps };
    } catch (err: any) {
      return { safe: false, reason: `DNS lookup failed: ${err.message}` };
    }
  },

  /**
   * Cleans and normalizes URLs by removing tracking parameters and trailing slashes
   */
  normalizeUrl(rawUrl: string): string {
    try {
      const urlObj = new URL((rawUrl || '').trim());
      urlObj.protocol = urlObj.protocol.toLowerCase();
      urlObj.hostname = urlObj.hostname.toLowerCase();
      urlObj.hash = '';
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'ref', 'source', '_ga', 'mc_eid', 'yclid', 'igshid'
      ];
      trackingParams.forEach((p) => urlObj.searchParams.delete(p));
      let cleaned = urlObj.toString();
      if (cleaned.endsWith('/') && urlObj.pathname !== '/') {
        cleaned = cleaned.slice(0, -1);
      }
      return cleaned;
    } catch {
      return (rawUrl || '').trim();
    }
  },
};
