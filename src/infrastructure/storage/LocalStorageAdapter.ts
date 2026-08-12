/**
 * High-performance storage adapter with in-memory write-through cache
 * to eliminate repetitive synchronous localStorage deserialization overhead.
 * Node.js Server SSR Safe.
 */
export class LocalStorageAdapter {
  private static cache: Map<string, any[]> = new Map();

  private static isLocalStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  public static getItem<T>(key: string): T[] {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T[];
    }
    if (!this.isLocalStorageAvailable()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      this.cache.set(key, parsed);
      return parsed;
    } catch {
      return [];
    }
  }

  public static setItem<T>(key: string, items: T[]): void {
    this.cache.set(key, items);
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(items));
    } catch (err) {
      console.warn(`[LocalStorageAdapter] Failed to write key ${key}:`, err);
    }
  }

  public static clearCache(): void {
    this.cache.clear();
  }
}
