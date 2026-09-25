/**
 * Diagnostic Script: Trending & Hot Velocity Endpoint Connectivity & Auth Probe
 * Path: .github/scripts/diagnose-trending.ts
 *
 * Runs inside GitHub Actions CI/CD to provide observability before the main trending cycle:
 *  1. Tests DNS & base reachability via /api/health
 *  2. Tests unauthenticated access to /api/cron/trending-calc (verifies auth guard is active)
 *  3. Tests authenticated access with CRON_SECRET (verifies secret validation & DB calculation)
 */

interface HealthCheckResponse {
  status?: string;
  database?: string;
  runtime?: string;
  responseTimeMs?: number;
  components?: {
    database?: { status?: string; latencyMs?: number };
    news_ingestion?: { status?: string };
    ai?: { status?: string };
  };
}

interface TrendingResponse {
  success?: boolean;
  message?: string;
  trendingCount?: number;
  topTrendingArticles?: Array<{ id: number; title: string; trendingScore?: number }>;
  updatedRows?: number;
  code?: string;
  error?: string;
}

interface DiagnosticResult {
  step: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'SKIPPED';
  httpStatus?: number;
  durationMs: number;
  details: string;
}

async function runDiagnostics(): Promise<void> {
  const results: DiagnosticResult[] = [];
  const startTime = Date.now();

  console.log('===============================================================');
  console.log('🔍 TRENDING ENDPOINT DIAGNOSTIC & OBSERVABILITY PROBE');
  console.log('===============================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // 1. Resolve and normalize target base URL
  const rawUrl = process.env.APP_URL || '';
  let baseUrl = rawUrl.trim();
  if (!baseUrl) {
    baseUrl = 'https://naweayh.xyz';
    console.log(`APP_URL: Not set in environment -> Using default: ${baseUrl}`);
  } else {
    console.log(`APP_URL: Set via environment -> ${baseUrl}`);
  }

  // Normalize: enforce https, strip www, remove trailing slashes
  baseUrl = baseUrl.replace(/^http:\/\//i, 'https://');
  baseUrl = baseUrl.replace(/^https:\/\/www\./i, 'https://');
  baseUrl = baseUrl.replace(/\/+$/, '');

  const cronSecret = (process.env.CRON_SECRET || '').trim();
  const hasSecret = cronSecret.length > 0;

  console.log(`Normalized Base URL: ${baseUrl}`);
  console.log(`CRON_SECRET Present: ${hasSecret ? `YES (${cronSecret.length} chars)` : 'NO (Missing)'}`);
  console.log('---------------------------------------------------------------\n');

  // STEP 1: Base Connectivity & Health Check
  console.log('▶ STEP 1: Probing Production Health Endpoint (/api/health)...');
  const healthUrl = `${baseUrl}/api/health`;
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'GitHub-Actions-DiagnosticProbe/1.0',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const durationMs = Date.now() - t0;

    let healthData: HealthCheckResponse | null = null;
    try {
      healthData = (await res.json()) as HealthCheckResponse;
    } catch {
      // Non-JSON response
    }

    if (res.ok) {
      const dbStatus = healthData?.database || healthData?.components?.database?.status || 'UNKNOWN';
      const dbLatency = healthData?.components?.database?.latencyMs ?? healthData?.responseTimeMs ?? durationMs;
      console.log(`  ✓ Health Probe: HTTP ${res.status} (${durationMs}ms)`);
      console.log(`    - Overall Status: ${healthData?.status || 'ok'}`);
      console.log(`    - Database: ${dbStatus} (${dbLatency}ms latency)`);
      console.log(`    - Runtime: ${healthData?.runtime || 'Node/Vercel'}`);

      results.push({
        step: 'Base Health Check (/api/health)',
        status: dbStatus === 'HEALTHY' || res.status === 200 ? 'PASS' : 'WARN',
        httpStatus: res.status,
        durationMs,
        details: `HTTP ${res.status} | DB: ${dbStatus} (${dbLatency}ms)`,
      });
    } else {
      console.log(`  ⚠ Health Probe returned non-200: HTTP ${res.status} (${durationMs}ms)`);
      results.push({
        step: 'Base Health Check (/api/health)',
        status: 'WARN',
        httpStatus: res.status,
        durationMs,
        details: `HTTP ${res.status} (Health check responded with non-200 status)`,
      });
    }
  } catch (err: any) {
    const durationMs = Date.now() - t0;
    const isTimeout = err?.name === 'AbortError';
    const message = isTimeout ? 'Timeout after 15s' : err?.message || String(err);
    console.log(`  ❌ Health Probe Failed: ${message} (${durationMs}ms)`);
    results.push({
      step: 'Base Health Check (/api/health)',
      status: 'FAIL',
      durationMs,
      details: `Connection failed: ${message}`,
    });
  }

  // STEP 2: Endpoint Existence & Unauthenticated Guard Verification
  console.log('\n▶ STEP 2: Probing Endpoint Guard Without Auth (/api/cron/trending-calc)...');
  const trendingUrl = `${baseUrl}/api/cron/trending-calc`;
  const t1 = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(trendingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'GitHub-Actions-DiagnosticProbe/1.0',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const durationMs = Date.now() - t1;

    if (res.status === 401 || res.status === 403) {
      console.log(`  ✓ Auth Guard Active: HTTP ${res.status} Unauthorized (${durationMs}ms)`);
      console.log('    - Endpoint exists and correctly rejects unauthenticated requests.');
      results.push({
        step: 'Auth Guard Verification (No Token)',
        status: 'PASS',
        httpStatus: res.status,
        durationMs,
        details: `HTTP ${res.status} | Endpoint is secured with validateCronSecret`,
      });
    } else if (res.status === 404) {
      console.log(`  ❌ Endpoint Not Found: HTTP 404 (${durationMs}ms)`);
      console.log('    - Warning: /api/cron/trending-calc is not reachable. Check server router configuration.');
      results.push({
        step: 'Auth Guard Verification (No Token)',
        status: 'FAIL',
        httpStatus: 404,
        durationMs,
        details: 'HTTP 404 | Endpoint does not exist at this path',
      });
    } else if (res.status === 200) {
      console.log(`  ⚠ Security Warning: HTTP 200 without credentials (${durationMs}ms)`);
      console.log('    - Warning: Endpoint allowed unauthenticated access.');
      results.push({
        step: 'Auth Guard Verification (No Token)',
        status: 'WARN',
        httpStatus: 200,
        durationMs,
        details: 'HTTP 200 | Endpoint allowed unauthenticated request (check CRON_SECRET requirement)',
      });
    } else {
      console.log(`  ⚠ Unexpected Status: HTTP ${res.status} (${durationMs}ms)`);
      results.push({
        step: 'Auth Guard Verification (No Token)',
        status: 'WARN',
        httpStatus: res.status,
        durationMs,
        details: `HTTP ${res.status}`,
      });
    }
  } catch (err: any) {
    const durationMs = Date.now() - t1;
    const isTimeout = err?.name === 'AbortError';
    const message = isTimeout ? 'Timeout after 15s' : err?.message || String(err);
    console.log(`  ❌ Request Failed: ${message} (${durationMs}ms)`);
    results.push({
      step: 'Auth Guard Verification (No Token)',
      status: 'FAIL',
      durationMs,
      details: `Connection failed: ${message}`,
    });
  }

  // STEP 3: Authenticated Probe with CRON_SECRET
  console.log('\n▶ STEP 3: Probing Authenticated Endpoint Execution (/api/cron/trending-calc)...');
  if (!hasSecret) {
    console.log('  ❌ SKIPPED: CRON_SECRET is not configured in environment.');
    console.log('    - To fix: Go to GitHub Repository Settings > Secrets and variables > Actions.');
    console.log('    - Add CRON_SECRET matching your Vercel production environment.');
    results.push({
      step: 'Authenticated Execution Probe',
      status: 'SKIPPED',
      durationMs: 0,
      details: 'CRON_SECRET missing from environment',
    });
  } else {
    const t2 = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(trendingUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'x-cron-secret': cronSecret,
          'User-Agent': 'GitHub-Actions-DiagnosticProbe/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: 'diagnostic-probe', timestamp: new Date().toISOString() }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const durationMs = Date.now() - t2;

      let trendingData: TrendingResponse | null = null;
      try {
        trendingData = (await res.json()) as TrendingResponse;
      } catch {
        // Non-JSON response
      }

      if (res.status >= 200 && res.status < 300) {
        console.log(`  ✓ Authenticated Call Succeeded: HTTP ${res.status} (${durationMs}ms)`);
        console.log(`    - Message: ${trendingData?.message || 'Calculation executed'}`);
        console.log(`    - Trending Articles Count: ${trendingData?.trendingCount ?? 'N/A'}`);
        console.log(`    - Updated Rows in DB: ${trendingData?.updatedRows ?? 'N/A'}`);
        if (trendingData?.topTrendingArticles && trendingData.topTrendingArticles.length > 0) {
          console.log(`    - Top Article: "${trendingData.topTrendingArticles[0].title}" (Score: ${trendingData.topTrendingArticles[0].trendingScore})`);
        }

        results.push({
          step: 'Authenticated Execution Probe',
          status: 'PASS',
          httpStatus: res.status,
          durationMs,
          details: `HTTP ${res.status} | ${trendingData?.message || 'OK'} | Count: ${trendingData?.trendingCount ?? 0}`,
        });
      } else if (res.status === 401 || res.status === 403) {
        console.log(`  ❌ Authentication Rejected: HTTP ${res.status} (${durationMs}ms)`);
        console.log('    - CRON_SECRET value provided in GitHub Actions does NOT match CRON_SECRET in Vercel.');
        console.log('    - Response message:', trendingData?.message || trendingData?.error || 'Unauthorized');
        results.push({
          step: 'Authenticated Execution Probe',
          status: 'FAIL',
          httpStatus: res.status,
          durationMs,
          details: `HTTP ${res.status} | Authentication failed. CRON_SECRET mismatch.`,
        });
      } else if (res.status === 500) {
        console.log(`  ❌ Server Internal Error: HTTP 500 (${durationMs}ms)`);
        console.log('    - Error details:', trendingData?.error || trendingData?.message || 'Internal database or calculation error');
        results.push({
          step: 'Authenticated Execution Probe',
          status: 'FAIL',
          httpStatus: 500,
          durationMs,
          details: `HTTP 500 | Database or Server calculation error: ${trendingData?.error || 'Unknown'}`,
        });
      } else if (res.status === 502 || res.status === 503) {
        console.log(`  ❌ Gateway Error: HTTP ${res.status} (${durationMs}ms)`);
        console.log('    - Production host is restarting, warming up, or temporarily unavailable.');
        results.push({
          step: 'Authenticated Execution Probe',
          status: 'FAIL',
          httpStatus: res.status,
          durationMs,
          details: `HTTP ${res.status} | Service unavailable or restarting`,
        });
      } else {
        console.log(`  ⚠ Unexpected Response: HTTP ${res.status} (${durationMs}ms)`);
        results.push({
          step: 'Authenticated Execution Probe',
          status: 'WARN',
          httpStatus: res.status,
          durationMs,
          details: `HTTP ${res.status}`,
        });
      }
    } catch (err: any) {
      const durationMs = Date.now() - t2;
      const isTimeout = err?.name === 'AbortError';
      const message = isTimeout ? 'Timeout after 30s' : err?.message || String(err);
      console.log(`  ❌ Authenticated Request Failed: ${message} (${durationMs}ms)`);
      results.push({
        step: 'Authenticated Execution Probe',
        status: 'FAIL',
        durationMs,
        details: `Connection failed: ${message}`,
      });
    }
  }

  // DIAGNOSTIC SUMMARY
  const totalDuration = Date.now() - startTime;
  console.log('\n===============================================================');
  console.log('📊 DIAGNOSTIC SUMMARY & OBSERVABILITY REPORT');
  console.log('===============================================================');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : r.status === 'SKIPPED' ? '⏭️' : '❌';
    console.log(`${icon} [${r.status.padEnd(7)}] ${r.step}`);
    console.log(`   Details:  ${r.details}`);
    console.log(`   Duration: ${r.durationMs}ms\n`);
  }
  console.log(`Total Diagnostic Time: ${totalDuration}ms`);
  console.log('===============================================================\n');

  // Conclude
  const hasFailures = results.some(r => r.status === 'FAIL');
  if (hasFailures) {
    console.log('⚠️ Diagnostics noted one or more issues above.');
  } else {
    console.log('🎉 Diagnostics passed. Endpoint connectivity and configuration look sound.');
  }
}

// Execute probe
runDiagnostics().catch(err => {
  console.error('Fatal diagnostic probe error:', err);
});
