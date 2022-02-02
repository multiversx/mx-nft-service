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
    try {
      const stream = client.scanStream({ match: cacheKey, count: 100 });
      var pipeline = client.pipeline();
      let keys = [];
      console.log('key pattern: ', key);
      stream.on('data', async function (resultKeys) {
        for (var i = 0; i < resultKeys.length; i++) {
          keys.push(resultKeys[i]);
          pipeline.del(resultKeys[i]);
        }

        console.log('found keys: ', keys);
        if (keys.length > 100) {
          pipeline.exec(() => {
            console.log('one batch delete complete');
          });
          keys = [];
          pipeline = client.pipeline();
        }
      });
      stream.on('end', function () {
        pipeline.exec(() => {
          console.log('final batch delete complete');
        });
      });
      stream.on('error', function (err) {
        console.log('error', err);
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
