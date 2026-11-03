/**
 * Session Cache Manager for Hatey Hat
 * Provides ultra-fast in-memory and sessionStorage caching for read-heavy API data
 * (events catalog, event details, community stats).
 * 
 * - Persists across internal route transitions and component unmount/remounts.
 * - Stays active until the browser tab or window is closed.
 * - Automatically purged when mutating actions occur (create/edit/delete/join).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const CACHE_PREFIX = "hatey_hat_cache_";
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes (session lifetime)

export function getCachedData<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const now = Date.now();

  // 1. Check in-memory Map first (instant 0ms retrieval)
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key)!;
    if (now - entry.timestamp < ttlMs) {
      return entry.data as T;
    }
    memoryCache.delete(key);
  }

  // 2. Fall back to sessionStorage (survives component unmounts and page navigation)
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        if (now - parsed.timestamp < ttlMs) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
        window.sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      }
    } catch {
      // Ignore sessionStorage parsing or quota errors
    }
  }

  return null;
}

export function setCachedData<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  // Save to in-memory map
  memoryCache.set(key, entry);

  // Save to sessionStorage
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
      // Ignore quota exceeded errors
    }
  }
}

export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memoryCache.clear();
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          if (k && k.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
      } catch {}
    }
    return;
  }

  const matchFn = (k: string) => {
    if (typeof pattern === "string") return k.includes(pattern);
    return pattern.test(k);
  };

  for (const k of Array.from(memoryCache.keys())) {
    if (matchFn(k)) memoryCache.delete(k);
  }

  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX) && matchFn(k.replace(CACHE_PREFIX, ""))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {}
  }
}
