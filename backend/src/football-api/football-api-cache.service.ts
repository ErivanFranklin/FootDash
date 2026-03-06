import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class FootballApiCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FootballApiCacheService.name);
  private redis: Redis | null = null;
  private readonly enabled: boolean;
  private readonly defaultTtl: number;
  private readonly connectTimeoutMs = 3000;

  /** TTL presets (seconds) */
  static readonly TTL = {
    TEAM_INFO: 86_400,       // 24 hours – team metadata rarely changes
    TEAM_STATS: 3_600,       // 1 hour
    FIXTURES_RECENT: 300,    // 5 minutes – scores may update
    FIXTURES_UPCOMING: 1_800, // 30 minutes
    FIXTURES_ALL: 600,       // 10 minutes
    MATCH_LIVE: 30,          // 30 seconds for live matches
    MATCH_FINISHED: 86_400,  // 24 hours for finished matches
  } as const;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    this.enabled = Boolean(redisUrl);
    this.defaultTtl = 300; // 5 min fallback

    if (this.enabled) {
      this.redis = new Redis(redisUrl!, {
        lazyConnect: true,
        connectTimeout: this.connectTimeoutMs,
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
      });
    }
  }

  async onModuleInit() {
    if (!this.redis) {
      this.logger.warn('Redis URL not configured – API caching disabled');
      return;
    }

    try {
      await Promise.race([
        this.redis.connect(),
        new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error(`Redis cache connect timeout after ${this.connectTimeoutMs}ms`)),
            this.connectTimeoutMs,
          );
        }),
      ]);
      this.logger.log('Redis cache connected');
    } catch (err: any) {
      this.logger.error(`Redis connection failed: ${err.message}`);
      this.redis.disconnect();
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /** Build a deterministic cache key */
  buildKey(prefix: string, params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return `footdash:api:${prefix}:${sorted}`;
  }

  /** Get cached value (returns null on miss or if disabled) */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      this.logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(raw) as T;
    } catch (err: any) {
      this.logger.warn(`Cache GET error: ${err.message}`);
      return null;
    }
  }

  /** Set a value in cache */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.redis) return;
    try {
      const ttl = ttlSeconds ?? this.defaultTtl;
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
      this.logger.debug(`Cache SET: ${key} (ttl=${ttl}s)`);
    } catch (err: any) {
      this.logger.warn(`Cache SET error: ${err.message}`);
    }
  }

  /** Delete a specific key */
  async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch {
      // best effort
    }
  }

  /** Delete all keys matching a pattern (e.g. invalidate all fixtures for a team) */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;
    try {
      const keys = await this.redis.keys(`footdash:api:${pattern}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache invalidated ${keys.length} keys for pattern: ${pattern}`);
      }
      return keys.length;
    } catch (err: any) {
      this.logger.warn(`Cache invalidation error: ${err.message}`);
      return 0;
    }
  }

  /** Check if cache is available */
  isAvailable(): boolean {
    return this.redis !== null;
  }

  /** Get cache stats for monitoring */
  async getStats(): Promise<{ available: boolean; keys?: number; memory?: string }> {
    if (!this.redis) return { available: false };
    try {
      const info = await this.redis.info('memory');
      const memMatch = info.match(/used_memory_human:(\S+)/);
      const dbSize = await this.redis.dbsize();
      return {
        available: true,
        keys: dbSize,
        memory: memMatch?.[1] ?? 'unknown',
      };
    } catch {
      return { available: false };
    }
  }
}
