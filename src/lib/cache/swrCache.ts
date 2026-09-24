/**
 * High-Performance Client SWR (Stale-While-Revalidate) Cache
 * Provides instant 0ms memory + local hydration across route switches
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const memoryCache = new Map<string, CacheEntry<any>>()
const CACHE_PREFIX = 'cultlike_swr_'

export function getCached<T>(key: string, maxAgeMs = 5 * 60 * 1000): T | null {
  // 1. Check in-memory cache first (0ms synchronous lookup)
  const entry = memoryCache.get(key)
  if (entry) {
    if (Date.now() - entry.timestamp < maxAgeMs) {
      return entry.data as T
    }
  }

  // 2. Check localStorage on browser client for warm reload
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.timestamp === 'number') {
          // Populate memory cache so subsequent reads are instant 0ms
          memoryCache.set(key, parsed)
          return parsed.data as T
        }
      }
    } catch {
      // Ignore JSON or storage errors
    }
  }

  return null
}

export function setCached<T>(key: string, data: T, persistToDisk = true): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now()
  }

  // Update in-memory cache
  memoryCache.set(key, entry)

  // Persist to localStorage if requested
  if (persistToDisk && typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry))
    } catch {
      // Storage quota or private browsing fallback
    }
  }
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear()
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k?.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(k)
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k))
      } catch {}
    }
    return
  }

  // Invalidate matching keys
  const keysToDelete: string[] = []
  memoryCache.forEach((_, k) => {
    if (k.startsWith(keyPrefix)) {
      keysToDelete.push(k)
    }
  })
  keysToDelete.forEach((k) => memoryCache.delete(k))

  if (typeof window !== 'undefined') {
    try {
      const prefix = `${CACHE_PREFIX}${keyPrefix}`
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(prefix)) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch {}
  }
}
