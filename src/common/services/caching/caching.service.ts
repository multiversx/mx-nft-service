import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { TimeConstants } from 'src/utils/time-utils';
import { LocalCacheService } from './local.cache.service';
import { RedisCacheService } from './redis-cache.service';

@Injectable()
export class CachingService {
  private DEFAULT_TTL = 300;
  constructor(
    private readonly localCacheService: LocalCacheService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  getClient(clientName: string): Redis.Redis {
    return this.redisCacheService.getClient(clientName);
  }
  async getOrSetCache<T>(
    client,
    key: string,
    promise: () => Promise<T>,
    remoteTtl: number = this.DEFAULT_TTL,
    localTtl: number | undefined = undefined,
    forceRefresh: boolean = false,
  ): Promise<T> {
    if (!localTtl) {
      localTtl = remoteTtl / 2;
    }

    const profiler = new PerformanceProfiler(`vmQuery:${key}`);

    if (!forceRefresh) {
      const cachedValue = await this.localCacheService.getCacheValue<T>(key);
      if (cachedValue !== undefined) {
        profiler.stop(`Local Cache hit for key ${key}`);
        return cachedValue;
      }

      const cached = await this.redisCacheService.get(client, key);

      console.log('From redis cache', { cached });
      if (cached !== undefined && cached !== null) {
        profiler.stop(`Remote Cache hit for key ${key}`);

        // we only set ttl to half because we don't know what the real ttl of the item is and we want it to work good in most scenarios
        await this.localCacheService.setCacheValue<T>(key, cached, localTtl);
        return cached;
      }
    }

    const value = await this.executeWithPendingPromise(
      `caching:set:${key}`,
      promise,
    );
    profiler.stop(`Cache miss for key ${key}`);

    if (localTtl > 0) {
      await this.localCacheService.setCacheValue<T>(key, value, localTtl);
    }

    if (remoteTtl > 0) {
      await this.redisCacheService.set(client, key, value, remoteTtl);
    }
    return value;
  }

  public async setCache<T>(
    client: Redis.Redis,
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    await this.localCacheService.setCacheValue<T>(key, value, ttl);
    await this.redisCacheService.set(client, key, value, ttl);
    return value;
  }

  async deleteInCache(client: Redis.Redis, key: string): Promise<void> {
    this.localCacheService.deleteCacheKey(key);
    this.redisCacheService.del(client, key);
  }

  pendingPromises: { [key: string]: Promise<any> } = {};

  private async executeWithPendingPromise<T>(
    key: string,
    promise: () => Promise<T>,
  ): Promise<T> {
    let pendingGetRemote = this.pendingPromises[key];
    if (pendingGetRemote) {
      return await pendingGetRemote;
    } else {
      try {
        pendingGetRemote = promise();

        this.pendingPromises[key] = pendingGetRemote;

        return await pendingGetRemote;
      } finally {
        delete this.pendingPromises[key];
      }
    }
  }

  async deleteInCacheLocal(key: string) {
    await this.localCacheService.deleteCacheKey(key);
  }

  async refreshCacheLocal<T>(
    redisClient,
    key: string,
    ttl: number = TimeConstants.oneHour,
  ): Promise<T | undefined> {
    const value = await this.redisCacheService.get(redisClient, key);
    if (value) {
      await this.localCacheService.setCacheValue<T>(key, value, ttl);
    } else {
      await this.deleteInCacheLocal(key);
    }

    return value;
  }
}
