/**
 * Arabic Text Normalization Utility
 * Normalizes Arabic letters (أ، إ، آ -> ا), (ة -> ه), (ى -> ي),
 * removes diacritics (التشكيل), and strips punctuation for accurate search matching.
 */

export function normalizeArabicText(text: string): string {
  if (!text) return '';

  let normalized = text.toLowerCase();

  // Remove Arabic diacritics (Tashkeel)
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');

  // Normalize Alef variants: أ, إ, آ, ٱ -> ا
  normalized = normalized.replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627');

  // Normalize Teh Marbuta: ة -> ه
  normalized = normalized.replace(/\u0629/g, '\u0647');

  // Normalize Alef Maksura: ى -> ي
  normalized = normalized.replace(/\u0649/g, '\u064A');

  // Remove extra whitespace and special characters
  normalized = normalized.replace(/[^\w\s\u0600-\u06FF]/gi, ' ').replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Checks if a search query matches target text using Arabic normalization
 */
export function matchesArabicText(targetText: string, searchQuery: string): boolean {
  if (!searchQuery || searchQuery.trim().length === 0) return true;
  if (!targetText) return false;

  const normalizedTarget = normalizeArabicText(targetText);
  const normalizedQuery = normalizeArabicText(searchQuery);

  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0);
  return queryWords.every(word => normalizedTarget.includes(word));
}
