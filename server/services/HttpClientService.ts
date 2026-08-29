export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRedirects?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  maxResponseSizeBytes?: number;
}

export interface HttpResponseResult {
  statusCode: number;
  statusText: string;
  ok: boolean;
  body: string;
  finalUrl: string;
  redirected: boolean;
  responseTimeMs: number;
  headers: Record<string, string>;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Naw3iyaNewsEngine/3.6 (Enterprise Multi-Channel Ingestion Bot; +https://naweayh.xyz)',
];

const MAX_DEFAULT_BODY_SIZE = 2.5 * 1024 * 1024; // 2.5 MB

export class HttpClientService {
  private lastRequestTimes: Map<string, number> = new Map();

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  /**
   * Enforce domain rate limit (cooldown)
   */
  public async enforceRateLimit(urlStr: string, minIntervalMs: number = 400): Promise<void> {
    try {
      const hostname = new URL(urlStr).hostname;
      const last = this.lastRequestTimes.get(hostname) || 0;
      const now = Date.now();
      const elapsed = now - last;
      if (elapsed < minIntervalMs) {
        await new Promise((resolve) => setTimeout(resolve, minIntervalMs - elapsed));
      }
      this.lastRequestTimes.set(hostname, Date.now());
    } catch {}
  }

  /**
   * Production-Grade HTTP Client with SSRF Guards, Timeouts, Retries & Size Caps
   */
  public async fetchWithRetry(url: string, options: HttpRequestOptions = {}): Promise<HttpResponseResult> {
    const {
      timeoutMs = 7000,
      retryAttempts = 1,
      retryDelayMs = 800,
      headers = {},
      maxResponseSizeBytes = MAX_DEFAULT_BODY_SIZE,
    } = options;

    await this.enforceRateLimit(url);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
      }

      try {
        const startTime = Date.now();
        const browserHeaders = {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml,application/atom+xml,application/json;q=0.8,*/*;q=0.7',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
          ...headers,
        };

        const res = await fetch(url, {
          method: 'GET',
          headers: browserHeaders,
          redirect: 'follow',
          signal: AbortSignal.timeout(timeoutMs),
        });

        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        
        // Reject binary executable/zip/video/audio downloads
        if (
          contentType.includes('application/octet-stream') ||
          contentType.includes('application/zip') ||
          contentType.includes('application/x-') ||
          contentType.includes('video/') ||
          contentType.includes('audio/')
        ) {
          throw new Error(`Rejected invalid content-type: ${contentType}`);
        }

        // Check Content-Length header if provided
        const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
        if (contentLength > maxResponseSizeBytes) {
          throw new Error(`Response size exceeds limit (${contentLength} > ${maxResponseSizeBytes} bytes)`);
        }

        let body = await res.text();
        if (body.length > maxResponseSizeBytes) {
          body = body.slice(0, maxResponseSizeBytes);
        }

        const responseTimeMs = Date.now() - startTime;
        const resHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => {
          resHeaders[k.toLowerCase()] = v;
        });

        return {
          statusCode: res.status,
          statusText: res.statusText,
          ok: res.ok,
          body,
          finalUrl: res.url || url,
          redirected: res.redirected,
          responseTimeMs,
          headers: resHeaders,
        };
      } catch (err: any) {
        lastError = err;
        const isTransient =
          err.name === 'TimeoutError' ||
          err.code === 'ECONNRESET' ||
          err.code === 'ETIMEDOUT' ||
          err.message?.includes('fetch failed') ||
          err.message?.includes('aborted');

        if (!isTransient) {
          break; // Don't retry fatal/rejected errors
        }
      }
    }

    throw lastError || new Error(`Failed to fetch ${url} after ${retryAttempts} attempts`);
  }
}

export const httpClientService = new HttpClientService();
