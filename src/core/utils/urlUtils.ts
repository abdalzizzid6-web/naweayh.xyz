/**
 * Centralized URL Normalization Utility
 * Ensures all public, canonical, and sitemap URLs strictly adhere to https://naweayh.xyz
 * Prevents malformed concatenations like /https://naweayh.xyz, https://naweayh.xyz/https://..., etc.
 */

export const CANONICAL_BASE_DOMAIN = 'naweayh.xyz';
export const CANONICAL_ORIGIN = `https://${CANONICAL_BASE_DOMAIN}`;

/**
 * Builds a strict, canonical absolute URL.
 * Handles relative paths, absolute paths, already fully qualified URLs,
 * and malformed crawler/concatenation strings.
 */
export function buildAbsoluteUrl(inputPathOrUrl?: string | null): string {
  if (!inputPathOrUrl || typeof inputPathOrUrl !== 'string') {
    return `${CANONICAL_ORIGIN}/`;
  }

  let cleaned = inputPathOrUrl.trim();

  // Strip leading and trailing whitespace and null characters
  if (!cleaned || cleaned === '/' || cleaned === '#') {
    return `${CANONICAL_ORIGIN}/`;
  }

  // 1. Detect and repair malformed strings like:
  //    /https://naweayh.xyz/slug
  //    /https:/naweayh.xyz/slug
  //    https://naweayh.xyz/https://...
  //    https://naweayh.xyzhttps://naweayh.xyz/...
  cleaned = cleaned.replace(/^(\/+)?https?:\/+(?:www\.)?(?:naweayh\.xyz)?\/?/i, '');
  cleaned = cleaned.replace(/^https?:\/\/[^\/]+\/https?:\/\/[^\/]+\//i, '');
  cleaned = cleaned.replace(/^https?:\/\/naweayh\.xyz/i, '');
  cleaned = cleaned.replace(/^https?:\/\/www\.naweayh\.xyz/i, '');
  cleaned = cleaned.replace(/^https?:\/\/localhost(:\d+)?/i, '');
  cleaned = cleaned.replace(/^https?:\/\/127\.0\.0\.1(:\d+)?/i, '');

  // 2. Remove any remaining redundant leading slashes
  cleaned = cleaned.replace(/^\/+/, '');

  // 3. Prevent stray query parameters like ?cat=140 or ?p= from polluting canonical URLs
  if (cleaned.startsWith('?cat=') || cleaned.startsWith('?p=') || cleaned.startsWith('?page_id=')) {
    return `${CANONICAL_ORIGIN}/`;
  }

  // 4. Map legacy /article/ paths to canonical /news/
  if (cleaned.startsWith('article/')) {
    cleaned = cleaned.replace(/^article\//, 'news/');
  }

  // 5. Special case: if cleaned string was just "a" or empty
  if (cleaned === 'a' || cleaned === '') {
    return `${CANONICAL_ORIGIN}/`;
  }

  // Remove multiple consecutive slashes
  cleaned = cleaned.replace(/\/{2,}/g, '/');

  return `${CANONICAL_ORIGIN}/${cleaned}`;
}

/**
 * Builds canonical URL specifically for news articles with slug sanitization.
 */
export function buildArticleCanonicalUrl(slugOrId: string): string {
  if (!slugOrId) return `${CANONICAL_ORIGIN}/`;
  const cleanSlug = encodeURIComponent(
    decodeURIComponent(slugOrId).replace(/^\/+|\/+$/g, '')
  );
  return `${CANONICAL_ORIGIN}/news/${cleanSlug}`;
}

/**
 * Builds canonical URL for category pages.
 */
export function buildCategoryCanonicalUrl(categoryName: string): string {
  if (!categoryName) return `${CANONICAL_ORIGIN}/`;
  const cleanCat = encodeURIComponent(categoryName.trim());
  return `${CANONICAL_ORIGIN}/category/${cleanCat}`;
}

/**
 * Builds canonical URL for source pages.
 */
export function buildSourceCanonicalUrl(sourceName: string): string {
  if (!sourceName) return `${CANONICAL_ORIGIN}/`;
  const cleanSource = encodeURIComponent(sourceName.trim());
  return `${CANONICAL_ORIGIN}/source/${cleanSource}`;
}
