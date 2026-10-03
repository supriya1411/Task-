import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>;
  del(key: string | string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushall(): Promise<'OK'>;
  status: 'redis' | 'memory';
}

class MemoryRedisStore implements CacheStore {
  private store = new Map<string, { value: string; expiry: number | null }>();
  public status: 'memory' = 'memory';

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiry: number | null = null;
    if (mode === 'EX' && typeof duration === 'number') {
      expiry = Date.now() + duration * 1000;
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(keys: string | string[]): Promise<number> {
    const keyArr = Array.isArray(keys) ? keys : [keys];
    let count = 0;
    for (const k of keyArr) {
      if (this.store.delete(k)) count++;
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const now = Date.now();
    // Simple wildcard matching e.g. "tasks:*"
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched: string[] = [];
    for (const [key, item] of this.store.entries()) {
      if (item.expiry && now > item.expiry) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }
}

let redisClient: any = null;
let currentCacheStore: CacheStore = new MemoryRedisStore();
let redisConnected = false;

export async function initRedis(): Promise<CacheStore> {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl && redisUrl.trim() !== '') {
    try {
      console.log('[Redis] Attempting connection to Redis...');
      const client = new Redis(redisUrl, {
        connectTimeout: 2500,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        retryStrategy: () => null, // don't hang if offline
      });

      await client.connect();
      redisClient = client;
      redisConnected = true;
      console.log('[Redis] Successfully connected to live Redis server.');

      currentCacheStore = {
        get: (key: string) => client.get(key),
        set: (key: string, val: string, mode?: string, dur?: number) => {
          if (mode === 'EX' && dur) {
            return client.set(key, val, 'EX', dur);
          }
          return client.set(key, val);
        },
        del: async (keys: string | string[]) => {
          if (Array.isArray(keys)) {
            if (keys.length === 0) return 0;
            return client.del(...keys);
          }
          return client.del(keys);
        },
        keys: (pat: string) => client.keys(pat),
        flushall: () => client.flushall(),
        status: 'redis',
      };
      return currentCacheStore;
    } catch (err: any) {
      console.warn(`[Redis] Live Redis unavailable (${err.message}). Seamlessly activated in-memory Redis-compatible cache store.`);
      currentCacheStore = new MemoryRedisStore();
      return currentCacheStore;
    }
  } else {
    console.log('[Redis] No REDIS_URL supplied. Operating in integrated in-memory cache mode.');
    currentCacheStore = new MemoryRedisStore();
    return currentCacheStore;
  }
}

export function getCacheStore(): CacheStore {
  return currentCacheStore;
}

export function isRedisLive(): boolean {
  return redisConnected;
}
