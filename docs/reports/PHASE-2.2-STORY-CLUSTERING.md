# المرحلة 2.2: محرك تجميع القصص الإخبارية الذكي (STORY CLUSTERING ENGINE)

## 1. ملخص الإنجازات (Phase 2.2 Executive Summary)
تم بحمد الله إنجاز وتطوير محرك تجميع القصص الإخبارية (Story Clustering Engine) لمنصة **أخبار نوعية (Naw3iya News)** وفقاً للمواصفات القياسية المطلوبة.

---

## 2. هيكل قاعدة البيانات والـ Schema (Database & Indexes)
تم إنشاء جدول `story_clusters` مع العلاقات المناسبة والمؤشرات (Indexes):
- **الجدول**: `story_clusters` (يحتوي على `id`, `slug`, `title`, `summary`, `category`, `country`, `importance_score`, `status`, `first_published_at`, `last_updated_at`, `articles_count`, `sources_count`, إلخ).
- **العلاقة**: إضافة حقل `story_cluster_id` في جدول `news_articles` مع مفتاح أجنبي `REFERENCES story_clusters(id) ON DELETE SET NULL`.
- **الفهارس (Indexes)**: تمت إضافة فهارس على الحقول النشطة (`story_cluster_id`, `published_at`, `category`, `country`, `importance_score`, `last_updated_at`) لضمان أداء فائق وسرعة في جلب النتائج.

---

## 3. خوارزمية التجميع والتشابه (Clustering Algorithm & Similarity Formula)
يعتمد محرك التجميع (`StoryClusteringService`) على عدة إشارات ذكية لضمان دقة دمج المقالات الخاصة بنفس الحدث:
- **Tokenization & Jaccard Similarity (45%)**: مقارنة الكلمات المفتاحية في العنوان والملخص بعد إزالة الشوائب ووقف الكلمات (Stop Words).
- **Category Match (20%)**: ضمان مطابقة القسم الإخباري.
- **Country Match (15%)**: مطابقة الدولة أو النطاق الجغرافي.
- **Time Proximity (20%)**: حساب القرب الزمني مع اضمحلال زمني على مدار 48 ساعة.
- **الاستقلالية عن الذكاء الاصطناعي**: يعمل النظام بكفاءة تامة ودون توقف في حال عدم توفر مفتاح Gemini AI، مع دعم التكامل التلقائي للذكاء الاصطناعي عند توفره.

---

## 4. واجهات البرمجة (API Endpoints)
تم توفير الـ Endpoints التالية بكفاءة تامة:
- `GET /api/v1/stories`: استعراض قائمة القصص النشطة مع الفلترة والتصنيف.
- `GET /api/v1/stories/:slugOrId`: جلب تفاصيل القصة مع المقالات والمصادر.
- `GET /api/v1/stories/:id/articles`: جلب مقالات القصة.
- `GET /api/v1/stories/:id/sources`: جلب المصادر المشاركة في التغطية.
- `GET /api/v1/stories/:id/timeline`: الخط الزمني للحدث (Timeline).
- `GET /api/v1/stories/:id/related`: القصص ذات الصلة.
- **إدارة المحتوى (Admin RBAC)**:
  - `POST /api/v1/admin/stories/:id/merge` (دمج قصتين)
  - `POST /api/v1/admin/stories/:id/split` (فصل مقال)
  - `POST /api/v1/admin/stories/:id/assign` (نقل مقال لقصة أخرى)
  - `POST /api/v1/admin/stories/:id/archive` (أرشفة القصة)

---

## 5. تجربة المستخدم والواجهة الأمامية (Frontend & Mobile UX)
- **الصفحة الرئيسية (Stories First)**: تم إبراز قصص الأحداث الكبرى في مقدمة الموقع مع عرض عدد المصادر والتحديث الزمني.
- **صفحة القصة (`/story/:slug`)**: تحتوي على:
  - الترويسة الرئيسية والملخص ومؤشر الأهمية.
  - أشرطة شعارات المصادر الموثوقة ومؤشرات الموثوقية.
  - تبويبات تفاعلية (نظرة عامة، الخط الزمني، جميع التغطيات، المصادر).
  - تصميم متجاوب وممتاز على الهواتف والأجهزة الذكية.

---

## 6. نتائج الاختبار والتحقق (Test Results & Build Verification)
- **TypeScript (`tsc --noEmit`)**: تم اجتياز الفحص بنجاح تام بدون أخطاء.
- **Build (`npm run build`)**: تم بناء السيرفر وحزمة الواجهة الأمامية (`dist/server.cjs`) بنجاح تامة.
- **اختبار البيانات الحقيقية**: تم التحقق من جلب المقالات الحقيقية ودمجها تلقائياً في قصص موحدة تظهر للمستخدمين مباشرة.
