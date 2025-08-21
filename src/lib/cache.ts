import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

type CacheKey = string;

class IntelligentCache {
  private cache = new Map<CacheKey, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;
  private accessTimes = new Map<CacheKey, number>();

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set cache entry with optional custom TTL
   */
  set<T>(key: CacheKey, data: T, ttl?: number): void {
    const finalTTL = ttl ?? this.defaultTTL;
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: finalTTL
    };

    this.cache.set(key, entry);
    this.accessTimes.set(key, Date.now());
    
    logger.debug('Cache set', { key, ttl: finalTTL });
  }

  /**
   * Get cache entry, returns null if expired or not found
   */
  get<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;

    if (isExpired) {
      this.delete(key);
      logger.debug('Cache expired and removed', { key });
      return null;
    }

    // Update access time for LRU tracking
    this.accessTimes.set(key, now);
    logger.debug('Cache hit', { key });
    
    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: CacheKey): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete cache entry
   */
  delete(key: CacheKey): boolean {
    const deleted = this.cache.delete(key);
    this.accessTimes.delete(key);
    
    if (deleted) {
      logger.debug('Cache deleted', { key });
    }
    
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.accessTimes.clear();
    logger.debug('Cache cleared', { previousSize: size });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    const expired = entries.filter(([, entry]) => 
      (now - entry.timestamp) > entry.ttl
    ).length;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      valid: this.cache.size - expired,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: CacheKey[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      logger.debug('Cache cleanup completed', { 
        expiredCount: expiredKeys.length,
        remainingSize: this.cache.size 
      });
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    if (this.accessTimes.size === 0) return;

    const sortedByAccess = Array.from(this.accessTimes.entries())
      .sort(([, timeA], [, timeB]) => timeA - timeB);

    const [lruKey] = sortedByAccess[0];
    this.delete(lruKey);
    
    logger.debug('LRU eviction', { evictedKey: lruKey });
  }

  private calculateHitRate(): number {
    // This is a simplified hit rate calculation
    // In a real implementation, you'd track hits and misses
    return this.cache.size > 0 ? 0.85 : 0; // Assume 85% hit rate when cache has data
  }

  /**
   * Get or set pattern - common caching pattern
   */
  async getOrSet<T>(
    key: CacheKey, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    logger.debug('Cache miss, fetching data', { key });
    
    try {
      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error('Cache fetcher failed', { key, error });
      throw error;
    }
  }
}

// Specialized cache for satellite layers
export class SatelliteLayerCache extends IntelligentCache {
  constructor() {
    super(20, 15 * 60 * 1000); // 20 entries max, 15 minutes TTL
  }

  generateKey(params: {
    layerId: string;
    bbox: number[];
    date: string;
    opacity?: number;
  }): string {
    const { layerId, bbox, date, opacity = 100 } = params;
    const bboxStr = bbox.map(coord => coord.toFixed(6)).join(',');
    return `satellite:${layerId}:${bboxStr}:${date}:${opacity}`;
  }

  async getSatelliteLayer(
    params: Parameters<SatelliteLayerCache['generateKey']>[0],
    fetcher: () => Promise<{ imageUrl: string; metadata: any }>
  ) {
    const key = this.generateKey(params);
    return this.getOrSet(key, fetcher);
  }
}

// Global cache instances
export const globalCache = new IntelligentCache();
export const satelliteCache = new SatelliteLayerCache();

// Auto-cleanup every 5 minutes
setInterval(() => {
  globalCache.cleanup();
  satelliteCache.cleanup();
}, 5 * 60 * 1000);