import { pool, testDbConnection, initDb } from '../server/db/connection';
import { getCanonicalUrl, newsIngestionService } from '../server/services/NewsIngestionService';
import { duplicateDetectionEngine } from '../server/services/DuplicateDetectionEngine';
import { normalizeArabicText } from '../src/infrastructure/utils/arabicNormalizer';
import { contentExtractorService } from '../server/services/ContentExtractorService';
import { storyClusteringService } from '../server/services/StoryClusteringService';
import { calculateDeterministicTrustScore } from '../server/services/TrustScoreService';
import { aiPipelineService } from '../server/services/AIPipelineService';

async function runPhase3Verification() {
  console.log('================================================================');
  console.log('🚀 ENTERPRISE NEWS INGESTION & PROCESSING VERIFICATION - PHASE 3');
  console.log('================================================================\n');

  // Initialize DB Schema first
  await testDbConnection();

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  try {
    // 1. Audit TLS Security
    console.log('\n--- 1. TLS Security Configuration Audit ---');
    const tlsEnv = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    assert(tlsEnv !== '0', 'NODE_TLS_REJECT_UNAUTHORIZED is not disabled (must not equal "0")', `Current value: ${tlsEnv}`);

    // 2. Canonical URL Normalization
    console.log('\n--- 2. Canonical URL Normalization Engine ---');
    const rawUrl1 = 'https://Example.Com/news/article-123/?utm_source=twitter&utm_medium=social&fbclid=IwAR234#section2';
    const canonical1 = getCanonicalUrl(rawUrl1);
    assert(
      canonical1 === 'https://example.com/news/article-123',
      'Canonical URL strips tracking parameters, anchor hashes, and normalizes host/protocol',
      `Result: ${canonical1}`
    );

    const rawUrl2 = 'https://kuna.net.kw/ArticleDetails.aspx?id=312456&source=rss&ref=tg';
    const canonical2 = getCanonicalUrl(rawUrl2);
    assert(
      canonical2 === 'https://kuna.net.kw/ArticleDetails.aspx?id=312456',
      'Canonical URL preserves essential query params while stripping tracking params',
      `Result: ${canonical2}`
    );

    // 3. Arabic Normalization & NLP Tokenization
    console.log('\n--- 3. Arabic Text Normalization & Tokenization ---');
    const rawArabic = 'إِعْلَانُ وَزَارَةِ ٱلصِّحَّةِ فِي صَنْعَاءَ عَنْ مَشْرُوعٍ جَدِيدٍ 123!';
    const normArabic = normalizeArabicText(rawArabic);
    assert(
      !normArabic.includes('ِ') && !normArabic.includes('إ') && normArabic.includes('اعلان'),
      'Arabic normalizer strips diacritics (Tashkeel) and normalizes Alef/Hamza',
      `Normalized: ${normArabic}`
    );

    const tokens = duplicateDetectionEngine.tokenize('وزارة الصحة تعلن عن تدشين مشروع طبي جديد في صنعاء');
    assert(
      !tokens.has('في') && !tokens.has('عن') && tokens.has('وزاره') && tokens.has('الصحه'),
      'Tokenization correctly eliminates Arabic stop words and extracts root tokens',
      `Tokens: ${Array.from(tokens).join(', ')}`
    );

    // 4. Multi-Tier Deduplication (Exact URL, Exact Title, Semantic Similarity)
    console.log('\n--- 4. Multi-Tier Deduplication Engine ---');
    const testArticleTime = new Date().toISOString();
    const candidateSet = [
      {
        id: 99901,
        title: 'البنك المركزي اليمني يعلن عن حزمة إجراءات مصرفية جديدة',
        normalizedTitle: normalizeArabicText('البنك المركزي اليمني يعلن عن حزمة إجراءات مصرفية جديدة'),
        canonicalUrl: 'https://centralbank.ye/news/measures-2026',
        originalArticleUrl: 'https://centralbank.ye/news/measures-2026?src=rss',
        publishedAt: testArticleTime,
        sourceId: 1,
        tokens: duplicateDetectionEngine.tokenize('البنك المركزي اليمني يعلن عن حزمة إجراءات مصرفية جديدة'),
      },
    ];

    // Check 4a: Exact Canonical URL
    const dupCheck1 = await duplicateDetectionEngine.checkDuplicate(
      {
        title: 'تقرير مختلف لكن بنفس الرابط',
        canonicalUrl: 'https://centralbank.ye/news/measures-2026',
      },
      candidateSet
    );
    assert(dupCheck1.isDuplicate && dupCheck1.duplicateType === 'EXACT_URL', 'Level 1: Exact Canonical URL Duplicate Detected');

    // Check 4b: Exact Normalized Title
    const dupCheck2 = await duplicateDetectionEngine.checkDuplicate(
      {
        title: 'إعلان البنك المركزي اليمني عن حزمة إجراءات مصرفية جديدة',
        canonicalUrl: 'https://other-outlet.com/article/555',
      },
      candidateSet
    );
    assert(
      dupCheck2.isDuplicate && (dupCheck2.duplicateType === 'EXACT_TITLE' || dupCheck2.duplicateType === 'HIGH_SIMILARITY'),
      'Level 2 & 3: Normalized Title Duplicate / High Similarity Detected'
    );

    // Check 4c: Distinct Article
    const dupCheck3 = await duplicateDetectionEngine.checkDuplicate(
      {
        title: 'افتتاح معرض الفنون التشكيلية المعاصرة في مدينة المكلا بمحافظة حضرموت',
        canonicalUrl: 'https://hadramout-arts.org/news/expo-2026',
      },
      candidateSet
    );
    assert(!dupCheck3.isDuplicate && dupCheck3.duplicateType === 'NONE', 'Level 5: Distinct Non-Duplicate Article Allowed');

    // 5. Content Extraction & Quality Validation
    console.log('\n--- 5. Content Extraction & Quality Validation ---');
    const rawHtmlContent = `
      <div>
        <p>أعلنت المؤسسة العامة للاتصالات السلكية واللاسلكية اليوم عن إطلاق خدمات الألياف الضوئية الحديثة في عدد من المديريات.</p>
        <p>وأكد المدير العام في تصريح صحفي أن المشروع يهدف إلى تحسين سرعات الإنترنت وتوسيع التغطية لكافة المؤسسات والشركات والمواطنين.</p>
        <p>وأشار إلى أن الفرق الفنية باشرت أعمال التمديد والتركيب وفق أعلى المواصفات والمعايير المعتمدة لضمان استقرار الخدمة وكفاءتها.</p>
      </div>
    `;
    const extracted = contentExtractorService.extractFromFeedItem(rawHtmlContent, '', 'https://telecom.ye/ftth', {
      author: 'إدارة الإعلام والاتصال',
      publishedAt: new Date(),
    });

    assert(
      extracted.isFullContentAvailable && extracted.paragraphCount >= 3 && extracted.wordCount > 30,
      'Content Extractor validates full content availability, word count, and paragraph counts',
      `Full: ${extracted.isFullContentAvailable}, Paragraphs: ${extracted.paragraphCount}, Words: ${extracted.wordCount}`
    );

    // 6. Deterministic Trust Score
    console.log('\n--- 6. Deterministic Trust Score Engine ---');
    const trustEval = calculateDeterministicTrustScore({
      sourceReliability: 92,
      isSourceVerified: true,
      hasCanonicalUrl: true,
      isFullContentAvailable: true,
      wordCount: 150,
      hasAuthorAttribution: true,
      isPublicationConsistent: true,
    });
    assert(trustEval.score >= 85 && trustEval.score <= 100, 'Deterministic trust score computed realistically within valid range', `Score: ${trustEval.score}`);

    // 7. Story Clustering & PostgreSQL DB Operations
    console.log('\n--- 7. Story Clustering & Cluster Lifecycle ---');
    // Ensure news_sources table has at least one source for foreign key
    const srcRes = await pool.query('SELECT id, name, name_arabic FROM news_sources LIMIT 1');
    let testSourceId = srcRes.rows[0]?.id;
    if (!testSourceId) {
      const newSrc = await pool.query(
        `INSERT INTO news_sources (name, name_arabic, url, feed_url, country, language, category, type, enabled, trust_score)
         VALUES ('Test Agency', 'وكالة الاختبار', 'https://test.ye', 'https://test.ye/rss', 'اليمن', 'ar', 'أخبار عامة', 'RSS', true, 90)
         RETURNING id`
      );
      testSourceId = newSrc.rows[0].id;
    }

    const testArticle1Res = await pool.query(
      `INSERT INTO news_articles (
        title, slug, summary, content, formatted_body, content_html, content_text,
        source_id, category, country, language, original_article_url, canonical_url,
        published_at, trust_score, reading_time_minutes, is_full_content_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, 92, 2, true)
      RETURNING id`,
      [
        'انطلاق فعاليات مؤتمر الطاقة المتجددة في عدن بمشاركة دولية واسعة',
        `renewable-energy-aden-conf-${Date.now()}`,
        'انطلقت صباح اليوم فعاليات المؤتمر السنوي للطاقة النظيفة والمتجددة بحضور خبراء محليين ودوليين.',
        '<p>انطلقت صباح اليوم فعاليات المؤتمر السنوي للطاقة النظيفة والمتجددة بحضور خبراء محليين ودوليين لمناقشة سبل تعزيز مشاريع الطاقة الشمسية وطاقة الرياح.</p>',
        '<p>انطلقت صباح اليوم فعاليات المؤتمر السنوي للطاقة النظيفة والمتجددة بحضور خبراء محليين ودوليين لمناقشة سبل تعزيز مشاريع الطاقة الشمسية وطاقة الرياح.</p>',
        '<p>انطلقت صباح اليوم فعاليات المؤتمر السنوي للطاقة النظيفة والمتجددة بحضور خبراء محليين ودوليين لمناقشة سبل تعزيز مشاريع الطاقة الشمسية وطاقة الرياح.</p>',
        'انطلقت صباح اليوم فعاليات المؤتمر السنوي للطاقة النظيفة والمتجددة بحضور خبراء محليين ودوليين لمناقشة سبل تعزيز مشاريع الطاقة الشمسية وطاقة الرياح.',
        testSourceId,
        'اقتصاد',
        'اليمن',
        'ar',
        `https://test.ye/energy-conf-1-${Date.now()}`,
        `https://test.ye/energy-conf-1-${Date.now()}`,
      ]
    );
    const article1Id = testArticle1Res.rows[0].id;

    // Cluster article 1
    const cluster1Id = await storyClusteringService.processArticleForClustering({
      id: article1Id,
      title: 'انطلاق فعاليات مؤتمر الطاقة المتجددة في عدن بمشاركة دولية واسعة',
      summary: 'انطلقت صباح اليوم فعاليات المؤتمر السنوي للطاقة النظيفة والمتجددة بحضور خبراء محليين ودوليين.',
      category: 'اقتصاد',
      country: 'اليمن',
      sourceId: testSourceId,
      publishedAt: new Date().toISOString(),
    });
    assert(cluster1Id !== null && cluster1Id > 0, 'First article successfully created or assigned to story cluster', `Cluster ID: ${cluster1Id}`);

    // Insert article 2 on the same story from another wire
    const testArticle2Res = await pool.query(
      `INSERT INTO news_articles (
        title, slug, summary, content, formatted_body, content_html, content_text,
        source_id, category, country, language, original_article_url, canonical_url,
        published_at, trust_score, reading_time_minutes, is_full_content_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, 90, 2, true)
      RETURNING id`,
      [
        'مؤتمر الطاقة المتجددة في عدن يناقش حلول استدامة الكهرباء والمشاريع الشمسية',
        `renewable-energy-aden-conf-2-${Date.now()}`,
        'ناقش مؤتمر الطاقة المتجددة المنعقد في عدن خطط واستراتيجيات التحول إلى الطاقة النظيفة.',
        '<p>ناقش مؤتمر الطاقة المتجددة المنعقد في عدن خطط واستراتيجيات التحول إلى الطاقة النظيفة ومشاريع الطاقة الشمسية.</p>',
        '<p>ناقش مؤتمر الطاقة المتجددة المنعقد في عدن خطط واستراتيجيات التحول إلى الطاقة النظيفة ومشاريع الطاقة الشمسية.</p>',
        '<p>ناقش مؤتمر الطاقة المتجددة المنعقد في عدن خطط واستراتيجيات التحول إلى الطاقة النظيفة ومشاريع الطاقة الشمسية.</p>',
        'ناقش مؤتمر الطاقة المتجددة المنعقد في عدن خطط واستراتيجيات التحول إلى الطاقة النظيفة ومشاريع الطاقة الشمسية.',
        testSourceId,
        'اقتصاد',
        'اليمن',
        'ar',
        `https://test.ye/energy-conf-2-${Date.now()}`,
        `https://test.ye/energy-conf-2-${Date.now()}`,
      ]
    );
    const article2Id = testArticle2Res.rows[0].id;

    // Cluster article 2 - Should automatically attach to the same cluster!
    const cluster2Id = await storyClusteringService.processArticleForClustering({
      id: article2Id,
      title: 'مؤتمر الطاقة المتجددة في عدن يناقش حلول استدامة الكهرباء والمشاريع الشمسية',
      summary: 'ناقش مؤتمر الطاقة المتجددة المنعقد في عدن خطط واستراتيجيات التحول إلى الطاقة النظيفة.',
      category: 'اقتصاد',
      country: 'اليمن',
      sourceId: testSourceId,
      publishedAt: new Date().toISOString(),
    });
    assert(cluster2Id === cluster1Id, 'Related article automatically grouped into the existing story cluster', `Cluster 1: ${cluster1Id}, Cluster 2: ${cluster2Id}`);

    // Verify cluster articles_count in DB
    const clusterCheck = await pool.query('SELECT articles_count, sources_count FROM story_clusters WHERE id = $1', [cluster1Id]);
    assert(
      parseInt(clusterCheck.rows[0]?.articles_count, 10) >= 2,
      'Story cluster aggregate counter updated in PostgreSQL',
      `Articles in cluster: ${clusterCheck.rows[0]?.articles_count}`
    );

    // 8. AI Queue and Job Lifecycle in PostgreSQL
    console.log('\n--- 8. AI Jobs Lifecycle & Queue Verification ---');
    const jobRes = await pool.query(
      `INSERT INTO ai_jobs (article_id, job_type, status, attempts, payload, created_at)
       VALUES ($1, 'GEMINI_ANALYSIS_ENTITIES', 'PENDING', 0, $2, CURRENT_TIMESTAMP)
       RETURNING id, status`,
      [
        article1Id,
        JSON.stringify({
          title: 'انطلاق فعاليات مؤتمر الطاقة المتجددة في عدن',
          sourceName: 'وكالة الاختبار',
        }),
      ]
    );
    const createdJobId = jobRes.rows[0].id;
    assert(createdJobId > 0 && jobRes.rows[0].status === 'PENDING', 'AI Job successfully enqueued in PostgreSQL with PENDING status');

    // 9. Failure Handling & Source Health Tracking
    console.log('\n--- 9. Source Health & Failure Reason Classification ---');
    const failureReason = newsIngestionService.classifyFailureReason('Fetch failed: certificate has expired (TLS error)');
    assert(failureReason === 'TLS_ERROR', 'Classification of TLS error returns TLS_ERROR', `Result: ${failureReason}`);

    const healthCalc = newsIngestionService.calculateSourceHealth({
      successRate: 100,
      latencyMs: 450,
      articlesCount: 15,
      hasRecentArticle: true,
      consecutiveErrors: 0,
    });
    assert(healthCalc.healthScore >= 90 && healthCalc.statusClassification === 'EXCELLENT', 'Source Health Calculator outputs EXCELLENT for healthy source');

    // Clean up test articles
    await pool.query('DELETE FROM ai_jobs WHERE id = $1', [createdJobId]);
    await pool.query('DELETE FROM news_articles WHERE id IN ($1, $2)', [article1Id, article2Id]);
    if (cluster1Id) {
      await pool.query('DELETE FROM story_clusters WHERE id = $1', [cluster1Id]);
    }

    console.log('\n================================================================');
    console.log(`📊 PHASE 3 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      console.log('🎉 ALL ENTERPRISE NEWS INGESTION & PROCESSING TESTS PASSED!');
    } else {
      process.exit(1);
    }
  } catch (error: any) {
    console.error('💥 Fatal error during Phase 3 verification:', error);
    process.exit(1);
  }
}

runPhase3Verification().then(() => process.exit(0));
