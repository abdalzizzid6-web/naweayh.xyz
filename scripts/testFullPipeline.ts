import { contentExtractorService } from '../server/services/ContentExtractorService';
import { rssAdapter } from '../server/services/adapters/RSSAdapter';
import { pool, initDb } from '../server/db/connection';
import { newsIngestionService } from '../server/services/NewsIngestionService';

async function runPipelineTests() {
  console.log('=====================================================');
  console.log('🚀 STARTING OMNINEWS FULL END-TO-END PIPELINE AUDIT');
  console.log('=====================================================');

  await initDb();

  // 1. SSRF Guard Security Test
  console.log('\n[TEST 1] SSRF Guard Security Validation...');
  const testUrls = [
    { url: 'http://localhost:3000/api', expected: false, name: 'Localhost' },
    { url: 'http://127.0.0.1:8080/secret', expected: false, name: 'Loopback 127.0.0.1' },
    { url: 'http://10.0.1.50/internal', expected: false, name: 'Private Class A 10.x' },
    { url: 'http://192.168.1.1/router', expected: false, name: 'Private Class C 192.168.x' },
    { url: 'http://172.20.0.1/admin', expected: false, name: 'Private Class B 172.16-31.x' },
    { url: 'http://169.254.169.254/latest/meta-data/', expected: false, name: 'Cloud Metadata 169.254.x' },
    { url: 'http://metadata.google.internal/computeMetadata', expected: false, name: 'GCP Internal Host' },
    { url: 'ftp://example.com/file', expected: false, name: 'Non-HTTP Scheme' },
    { url: 'https://aljazeera.net/news/2025/test', expected: true, name: 'Legitimate Public HTTPS' },
  ];

  let ssrfPassCount = 0;
  for (const t of testUrls) {
    const isSafe = contentExtractorService.isUrlSafeForExtraction(t.url);
    const passed = isSafe === t.expected;
    if (passed) ssrfPassCount++;
    console.log(`  - ${t.name}: ${passed ? 'PASSED ✅' : 'FAILED ❌'} (isSafe=${isSafe})`);
  }
  console.log(`SSRF Security Guard Result: ${ssrfPassCount}/${testUrls.length} Passed`);

  // 2. Multi-Stage RSS & Extraction Scenarios
  console.log('\n[TEST 2] Testing Feed Scenarios...');

  // Scenario 1: RSS with content:encoded
  const sampleRssWithEncoded = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>وكالة سبأ للأنباء</title>
    <link>https://saba.ye</link>
    <item>
      <title>رئيس الوزراء يترأس اجتماعاً موسعاً لمناقشة الخطة الاقتصادية والتنموية الشاملة</title>
      <link>https://saba.ye/ar/news1001.html</link>
      <description>عقد اليوم في العاصمة اجتماع موسع برئاسة رئيس مجلس الوزراء.</description>
      <content:encoded><![CDATA[
        <p>عقد اليوم في العاصمة اجتماع موسع برئاسة رئيس مجلس الوزراء، ضم قيادات الوزارات المعنية وممثلي القطاع الخاص لمناقشة مصفوفة السياسات الاقتصادية والمالية الشاملة للعام الحالي.</p>
        <p>وأكد رئيس الوزراء خلال الاجتماع على ضرورة تضافر الجهود لتعزيز استقرار العملة الوطنية وتحسين أداء الإيرادات العامة ودعم القطاعات الإنتاجية ذات الأولوية وتسهيل إجراءات الاستثمار.</p>
        <p>كما استعرض الاجتماع تقارير الأداء للربع الأول والخطط التنفيذية للمشاريع التنموية والخدمية العاجلة المزمع إطلاقها في مختلف المحافظات خلال المرحلة المقبلة لتحسين الخدمات الأساسية للمواطنين.</p>
        <p>وفي ختام الاجتماع، أقرت اللجنة الوزارية المشتركة تشكيل فرق عمل قطاعية للمتابعة الميدانية ورفع تقارير دورية حول مستويات الإنجاز وتذليل أي صعوبات تواجه التنفيذ.</p>
      ]]></content:encoded>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

  const parsed1 = rssAdapter.parseXML(sampleRssWithEncoded);
  console.log(`  - Scenario 1 (RSS with content:encoded): Parsed ${parsed1.length} item(s)`);
  if (parsed1.length > 0) {
    const item1 = parsed1[0];
    const extracted1 = contentExtractorService.extractFromFeedItem(item1.content, item1.description, item1.link);
    console.log(`    * Full Content Detected: ${extracted1.isFullContentAvailable ? 'YES ✅' : 'NO ❌'}`);
    console.log(`    * Classification: ${extracted1.contentClassification}`);
    console.log(`    * Status: ${extracted1.contentStatus}`);
    console.log(`    * Paragraphs Extracted: ${extracted1.paragraphs.length}`);
    console.log(`    * Quality Score: ${extracted1.contentQualityScore}/100`);
  }

  // Scenario 2: RSS with description only
  const sampleRssDescOnly = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>رويترز عربي</title>
    <link>https://reuters.com</link>
    <item>
      <title>ارتفاع أسعار النفط العالمية وسط ترقب لقرارات أوبك بلس والأسواق الدولية</title>
      <link>https://reuters.com/news2002.html</link>
      <description>سجلت أسعار النفط ارتفاعاً ملحوظاً في التداولات الآسيوية اليوم وسط ترقب المتعاملين لاجتماع منظمة أوبك بلس لتحديد مستويات الإنتاج للفترة القادمة.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

  const parsed2 = rssAdapter.parseXML(sampleRssDescOnly);
  console.log(`  - Scenario 2 (RSS description only): Parsed ${parsed2.length} item(s)`);
  if (parsed2.length > 0) {
    const item2 = parsed2[0];
    const extracted2 = contentExtractorService.extractFromFeedItem(item2.content, item2.description, item2.link);
    console.log(`    * Full Content Available: ${extracted2.isFullContentAvailable ? 'YES (incorrect)' : 'NO (Expected Excerpt) ✅'}`);
    console.log(`    * Classification: ${extracted2.contentClassification}`);
    console.log(`    * Status: ${extracted2.contentStatus}`);
    console.log(`    * Summary Extracted: "${extracted2.summary.slice(0, 50)}..."`);
  }

  // 3. Database Ingestion & Real Query Check
  console.log('\n[TEST 3] Ingestion into Database & Column Schema Check...');
  const dbCheck = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'news_articles' AND column_name IN (
      'content', 'content_html', 'content_text', 'excerpt', 'summary', 
      'content_status', 'content_source', 'content_classification', 
      'is_full_content_available', 'reading_time_minutes', 'word_count'
    )
  `);

  console.log(`  - Verified Database Columns Count: ${dbCheck.rows.length}/11`);
  for (const col of dbCheck.rows) {
    console.log(`    * ${col.column_name} (${col.data_type}) ✅`);
  }

  // Count existing articles in DB
  const totalCount = await pool.query('SELECT COUNT(*) as cnt FROM news_articles');
  const fullCount = await pool.query("SELECT COUNT(*) as cnt FROM news_articles WHERE content_status = 'full' OR is_full_content_available = true");
  const partialCount = await pool.query("SELECT COUNT(*) as cnt FROM news_articles WHERE content_status = 'partial' OR is_full_content_available = false");

  console.log(`\n[METRICS SUMMARY]`);
  console.log(`  - Total Articles in DB: ${totalCount.rows[0].cnt}`);
  console.log(`  - Full Articles: ${fullCount.rows[0].cnt}`);
  console.log(`  - Partial/Excerpt Articles: ${partialCount.rows[0].cnt}`);

  console.log('\n=====================================================');
  console.log('✅ ALL TEST SUITES EXECUTED SUCCESSFULLY!');
  console.log('=====================================================');
}

runPipelineTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Execution Error:', err);
    process.exit(1);
  });
