import { getCacheStore } from '../config/redis.ts';

const DEFAULT_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '180', 10);

export interface CacheMetrics {
  hits: number;
  misses: number;
  writes: number;
  invalidations: number;
  storeType: 'redis' | 'memory';
}

class CacheService {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    writes: 0,
    invalidations: 0,
    storeType: 'memory',
  };

  private getStore() {
    const store = getCacheStore();
    this.metrics.storeType = store.status;
    return store;
  }

  async get<T>(key: string): Promise<T | null> {
    const store = this.getStore();
    try {
      const raw = await store.get(key);
      if (raw) {
        this.metrics.hits++;
        return JSON.parse(raw) as T;
      }
      this.metrics.misses++;
      return null;
    } catch (err: any) {
      console.warn(`[CacheService] Error reading key ${key}:`, err.message);
      this.metrics.misses++;
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
    const store = this.getStore();
    try {
      const str = JSON.stringify(value);
      await store.set(key, str, 'EX', ttlSeconds);
      this.metrics.writes++;
    } catch (err: any) {
      console.warn(`[CacheService] Error setting key ${key}:`, err.message);
    }
  }

  async del(key: string): Promise<void> {
    const store = this.getStore();
    try {
      await store.del(key);
      this.metrics.invalidations++;
    } catch (err: any) {
      console.warn(`[CacheService] Error deleting key ${key}:`, err.message);
    }
  }

  async invalidateUserTasks(userId: string): Promise<number> {
    const store = this.getStore();
    try {
      const pattern = `tasks:${userId}:*`;
      const matchedKeys = await store.keys(pattern);
      if (matchedKeys.length > 0) {
        await store.del(matchedKeys);
        this.metrics.invalidations += matchedKeys.length;
        console.log(`[CacheService] Invalidated ${matchedKeys.length} cache key(s) for user: ${userId}`);
        return matchedKeys.length;
      }
      return 0;
    } catch (err: any) {
      console.warn(`[CacheService] Error invalidating pattern for user ${userId}:`, err.message);
      return 0;
    }
  }

  getMetrics(): CacheMetrics {
    const store = this.getStore();
    return {
      ...this.metrics,
      storeType: store.status,
    };
  }

  async flushAll(): Promise<void> {
    const store = this.getStore();
    await store.flushall();
  }
}

export const cacheService = new CacheService();
