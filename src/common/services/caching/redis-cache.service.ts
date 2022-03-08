import { Injectable, Inject } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import * as Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RedisService } from 'nestjs-redis';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { generateCacheKey } from 'src/utils/generate-cache-key';
import { promisify } from 'util';
import { Logger } from 'winston';
import { LocalCacheService } from './local.cache.service';

@Injectable()
export class RedisCacheService {
  private DEFAULT_TTL = 300;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly redisService: RedisService,
    private readonly localCacheService: LocalCacheService,
  ) {}

  getClient(clientName: string): Redis.Redis {
    return this.redisService.getClient(clientName);
  }
  async get(
    client: Redis.Redis,
    key: string,
    region: string = null,
  ): Promise<any> {
    const cacheKey = generateCacheKey(key, region);
    try {
      return JSON.parse(await client.get(cacheKey));
    } catch (err) {
      this.logger.error(
        'An error occurred while trying to get from redis cache.',
        {
          path: 'redis-cache.service.get',
          exception: err,
          cacheKey: cacheKey,
        },
      );
      return null;
    }
  }

  async set(
    client: Redis.Redis,
    key: string,
    value: any,
    ttl: number = this.DEFAULT_TTL,
    region: string = null,
  ): Promise<void> {
    if (isNil(value)) {
      return;
    }
    const cacheKey = generateCacheKey(key, region);
    try {
      await client.set(cacheKey, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      this.logger.error(
        'An error occurred while trying to set in redis cache.',
        {
          path: 'redis-cache.service.set',
          exception: err,
          cacheKey: cacheKey,
        },
      );
      return;
    }
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
      const cachedValue = await this.getCacheLocal<T>(key);
      if (cachedValue !== undefined) {
        profiler.stop(`Local Cache hit for key ${key}`);
        return cachedValue;
      }

      const cached = await this.get(client, key);
      if (cached !== undefined && cached !== null) {
        profiler.stop(`Remote Cache hit for key ${key}`);

        // we only set ttl to half because we don't know what the real ttl of the item is and we want it to work good in most scenarios
        await this.setCacheLocal<T>(key, cached, localTtl);
        return cached;
      }
    }

    const value = await this.executeWithPendingPromise(
      `caching:set:${key}`,
      promise,
    );
    profiler.stop(`Cache miss for key ${key}`);

    if (localTtl > 0) {
      await this.setCacheLocal<T>(key, value, localTtl);
    }

    if (remoteTtl > 0) {
      await this.set(client, key, value, remoteTtl);
    }
    return value;
  }

  async setCacheLocal<T>(
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    return await this.localCacheService.setCacheValue<T>(key, value, ttl);
  }

  async getCacheLocal<T>(key: string): Promise<T | undefined> {
    return await this.localCacheService.getCacheValue<T>(key);
  }

  // async refreshCacheLocal<T>(
  //   client: Redis.Redis,
  //   key: string,
  //   ttl: number = this.DEFAULT_TTL,
  // ): Promise<T | undefined> {
  //   const value = await this.get(client, key);
  //   if (value) {
  //     await this.setCacheLocal<T>(key, value, ttl);
  //   } else {
  //     this.logger.info(`Deleting local cache key '${key}'`);
  //     await this.deleteInCacheLocal(key);
  //   }

  //   return value;
  // }

  // public async getCache<T>(
  //   client: Redis.Redis,
  //   key: string,
  // ): Promise<T | undefined> {
  //   const value = await this.getCacheLocal<T>(key);
  //   if (value) {
  //     return value;
  //   }

  //   return await this.get(client, key);
  // }

  public async setCache<T>(
    client: Redis.Redis,
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    await this.setCacheLocal<T>(key, value, ttl);
    await this.set(client, key, value, ttl);
    return value;
  }

  async batchGetCache<T>(
    client,
    keys: string[],
    region: string = null,
  ): Promise<T[]> {
    let profiler = new PerformanceProfiler();
    const chunks = this.getChunks(
      keys.map((key) => generateCacheKey(key, region)),
      100,
    );
    const asyncMGet = promisify(client.mget).bind(client);
    const result = [];
    try {
      for (const chunkKeys of chunks) {
        let chunkValues = await asyncMGet(chunkKeys);
        chunkValues = chunkValues.map((value: any) =>
          value ? JSON.parse(value) : null,
        );

        result.push(...chunkValues);
      }

      return result;
    } catch (error) {
      this.logger.error(
        'An error occurred while trying to get batch of keys from redis cache.',
        {
          path: 'redis-cache.service.batchGetCache',
          exception: error,
          cacheKeys: keys,
        },
      );
      return;
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('MGET', profiler.duration);
    }
  }

  async batchSetCache(
    client: Redis.Redis,
    keys: string[],
    values: any[],
    ttl: number,
    region: string = null,
  ) {
    let profiler = new PerformanceProfiler();
    try {
      const mapKeys = keys.map((key) => generateCacheKey(key, region));
      const chunks = this.getChunks(
        mapKeys.map((key, index) => {
          const element: any = {};
          element[key] = index;
          return element;
        }, 25),
      );

      const sets = [];

      for (const chunk of chunks) {
        const chunkKeys = chunk.map((element: any) => Object.keys(element)[0]);
        const chunkValues = chunk.map(
          (element: any) => values[Object.values(element)[0] as number],
        );

        sets.push(
          ...chunkKeys.map((key: string, index: number) => {
            return ['set', key, JSON.stringify(chunkValues[index]), 'ex', ttl];
          }),
        );
      }
      const multi = client.multi(sets);
      return promisify(multi.exec).call(multi);
    } catch (error) {
      this.logger.error(
        'An error occurred while trying to set batch of keys from redis cache.',
        {
          path: 'redis-cache.service.batchSetCache',
          exception: error,
          cacheKeys: keys,
        },
      );
      return;
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('MSET', profiler.duration);
    }
  }

  // async deleteInCacheLocal(key: string) {
  //   await this.localCacheService.deleteCacheKey(key);
  // }

  async del(
    client: Redis.Redis,
    key: string,
    region: string = null,
  ): Promise<void> {
    const cacheKey = generateCacheKey(key, region);
    try {
      await client.del(cacheKey);
    } catch (err) {
      this.logger.error(
        'An error occurred while trying to delete from redis cache.',
        {
          path: 'redis-cache.service.del',
          exception: err,
          cacheKey: cacheKey,
        },
      );
    }
  }

  async delByPattern(
    client: Redis.Redis,
    key: string,
    region: string = null,
  ): Promise<void> {
    const cacheKey = generateCacheKey(key, region);
    let profiler = new PerformanceProfiler();
    try {
      const stream = client.scanStream({ match: `${cacheKey}*`, count: 100 });
      let keys = [];
      stream.on('data', async function (resultKeys) {
        for (var i = 0; i < resultKeys.length; i++) {
          keys.push(resultKeys[i]);
        }
        const dels = keys.map((key) => ['del', key]);

        const multi = client.multi(dels);
        await promisify(multi.exec).call(multi);
      });

      stream.on('end', function () {
        console.log('final batch delete complete');
      });
    } catch (err) {
      this.logger.error(
        'An error occurred while trying to delete from redis cache by pattern.',
        {
          path: 'redis-cache.service.delByPattern',
          exception: err,
          cacheKey: cacheKey,
        },
      );
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('MDEL', profiler.duration);
    }
  }

  async flushDb(client: Redis.Redis): Promise<void> {
    try {
      await client.flushdb();
    } catch (err) {
      this.logger.error('An error occurred while trying to flush the db', {
        path: 'redis-cache.service.flushDb',
        exception: err,
      });
    }
  }

  async getOrSet(
    client: Redis.Redis,
    key: string,
    createValueFunc: () => any,
    ttl: number = this.DEFAULT_TTL,
    region: string = null,
  ): Promise<any> {
    let profiler = new PerformanceProfiler();
    const cachedData = await this.get(client, key, region);
    if (!isNil(cachedData)) {
      profiler.stop();
      MetricsCollector.setRedisDuration('GET', profiler.duration);
      return cachedData;
    }
    const internalCreateValueFunc = this.buildInternalCreateValueFunc(
      key,
      region,
      createValueFunc,
    );
    const value = await internalCreateValueFunc();
    await this.set(client, key, value, ttl, region);
    profiler.stop();
    MetricsCollector.setRedisDuration('SET', profiler.duration);

    return value;
  }

  async setOrUpdate(
    client: Redis.Redis,
    key: string,
    createValueFunc: () => any,
    ttl: number = this.DEFAULT_TTL,
    region: string = null,
  ): Promise<any> {
    const internalCreateValueFunc = this.buildInternalCreateValueFunc(
      key,
      region,
      createValueFunc,
    );
    const value = await internalCreateValueFunc();
    await this.set(client, key, value, ttl, region);
    return value;
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

  private getChunks<T>(array: T[], size = 25): T[][] {
    return array.reduce((result: T[][], item, current) => {
      const index = Math.floor(current / size);

      if (!result[index]) {
        result[index] = [];
      }

      result[index].push(item);

      return result;
    }, []);
  }

  async increment(
    client: Redis.Redis,
    key: string,
    ttl: number = null,
    region: string = null,
  ): Promise<number> {
    const cacheKey = generateCacheKey(key, region);
    try {
      const newValue = await client.incr(cacheKey);
      if (ttl) {
        await client.expire(cacheKey, ttl);
      }
      return newValue;
    } catch (err) {
      this.logger.error(
        `An error occurred while trying to increment redis key ${cacheKey}. Exception: ${err?.toString()}.`,
      );
    }
  }

  async decrement(
    client: Redis.Redis,
    key: string,
    ttl: number = null,
    region: string = null,
  ): Promise<number> {
    const cacheKey = generateCacheKey(key, region);
    try {
      const newValue = await client.decr(cacheKey);
      if (ttl) {
        await client.expire(cacheKey, ttl);
      }
      return newValue;
    } catch (err) {
      this.logger.error(
        `An error occurred while trying to decrement redis key ${cacheKey}. Exception: ${err?.toString()}.`,
      );
    }
  }

  private buildInternalCreateValueFunc(
    key: string,
    region: string,
    createValueFunc: () => any,
  ): () => Promise<any> {
    return async () => {
      try {
        let data = createValueFunc();
        if (data instanceof Promise) {
          data = await data;
        }
        return data;
      } catch (err) {
        this.logger.error(`An error occurred while trying to load value.`, {
          path: 'redis-cache.service.createValueFunc',
          exception: err,
          key,
          region,
        });
        return null;
      }
    };
  }
}
