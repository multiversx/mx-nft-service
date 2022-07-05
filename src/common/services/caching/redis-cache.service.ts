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

@Injectable()
export class RedisCacheService {
  private DEFAULT_TTL = 300;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly redisService: RedisService,
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
    let profiler = new PerformanceProfiler();
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
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('GET', profiler.duration);
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

    let profiler = new PerformanceProfiler();
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
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('SET', profiler.duration);
    }
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

  async del(
    client: Redis.Redis,
    key: string,
    region: string = null,
  ): Promise<void> {
    const cacheKey = generateCacheKey(key, region);
    let profiler = new PerformanceProfiler();
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
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('DEL', profiler.duration);
    }
  }

  async delMultiple(
    client: Redis.Redis,
    keys: string[],
    region: string = null,
  ): Promise<void> {
    const redisKeys = keys.map((key) => generateCacheKey(key, region));
    try {
      await client.del(redisKeys);
    } catch (err) {
      this.logger.error(
        'An error occurred while trying to delete multiple keys from redis cache.',
        {
          path: 'redis-cache.service.delMultiple',
          exception: err?.toString(),
          cacheKey: keys,
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
    const cachedData = await this.get(client, key, region);
    if (!isNil(cachedData)) {
      return cachedData;
    }
    const value = await this.buildInternalCreateValueFunc(
      key,
      region,
      createValueFunc,
    );
    await this.set(client, key, value, ttl, region);

    return value;
  }

  async getOrSetWithDifferentTtl(
    client: Redis.Redis,
    key: string,
    createValueFunc: () => any,
    region: string = null,
  ): Promise<any> {
    const cachedData = await this.get(client, key, region);
    if (!isNil(cachedData)) {
      return cachedData;
    }
    const value = await this.buildInternalCreateValueFunc(
      key,
      region,
      createValueFunc,
    );
    await this.set(client, key, value, value.ttl, region);

    return value;
  }

  async setOrUpdate(
    client: Redis.Redis,
    key: string,
    createValueFunc: () => any,
    ttl: number = this.DEFAULT_TTL,
    region: string = null,
  ): Promise<any> {
    const value = await this.buildInternalCreateValueFunc(
      key,
      region,
      createValueFunc,
    );
    await this.set(client, key, value, ttl, region);
    return value;
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

    let profiler = new PerformanceProfiler();
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
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('INCR', profiler.duration);
    }
  }

  async decrement(
    client: Redis.Redis,
    key: string,
    ttl: number = null,
    region: string = null,
  ): Promise<number> {
    const cacheKey = generateCacheKey(key, region);

    let profiler = new PerformanceProfiler();
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
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('DECR', profiler.duration);
    }
  }

  private async buildInternalCreateValueFunc(
    key: string,
    region: string,
    createValueFunc: () => any,
  ): Promise<any> {
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
  }
}
