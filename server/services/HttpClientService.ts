import http from 'http';
import https from 'https';

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRedirects?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
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

export class HttpClientService {
  private lastRequestTimes: Map<string, number> = new Map();

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  /**
   * Enforce domain rate limit (cooldown)
   */
  public async enforceRateLimit(urlStr: string, minIntervalMs: number = 500): Promise<void> {
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
   * Production-Grade HTTP Client with Redirects, Timeouts, Retries & Compression
   */
  public async fetchWithRetry(url: string, options: HttpRequestOptions = {}): Promise<HttpResponseResult> {
    const {
      timeoutMs = 8000,
      maxRedirects = 5,
      retryAttempts = 2,
      retryDelayMs = 1000,
      headers = {},
    } = options;

    await this.enforceRateLimit(url);

    let currentUrl = url;
    let redirectCount = 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * Math.pow(2, attempt - 1)));
      }

      try {
        const startTime = Date.now();
        const browserHeaders = {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.8',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          ...headers,
        };

        const res = await fetch(currentUrl, {
          method: 'GET',
          headers: browserHeaders,
          redirect: 'follow', // fetch automatically handles up to 20 redirects
          signal: AbortSignal.timeout(timeoutMs),
        });

        const body = await res.text();
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
          finalUrl: res.url || currentUrl,
          redirected: res.redirected || redirectCount > 0,
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
          break; // Don't retry non-transient errors
        }
      }
    }

    throw lastError || new Error(`Failed to fetch ${url} after ${retryAttempts} attempts`);
  }
}

export const httpClientService = new HttpClientService();
