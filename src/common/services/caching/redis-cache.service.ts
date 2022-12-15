import { Injectable, Logger } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import Redis, { RedisOptions } from 'ioredis';
import { cacheConfig } from 'src/config';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { promisify } from 'util';

@Injectable()
export class RedisCacheService {
  private DEFAULT_TTL = 300;
  private clients: { [key: string]: Redis } = {};
  private redisOptions: RedisOptions = {
    host: process.env.REDIS_URL,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  };

  constructor(private readonly logger: Logger) {}

  getClient(clientName: string): Redis.Redis {
    console.log('Redis ', this.redisOptions, process.env.REDIS_URL);
    if (this.clients[clientName]) {
      return this.clients[clientName];
    }

    const options: RedisOptions = {
      ...this.redisOptions,
      name: clientName,
      db: this.getClientDb(clientName),
    };
    this.clients[clientName] = new Redis(options);
    return this.clients[clientName];
  }

  async get(client: Redis.Redis, key: string): Promise<any> {
    const cacheKey = generateCacheKeyFromParams(key);
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
  ): Promise<void> {
    if (isNil(value)) {
      return;
    }
    const cacheKey = generateCacheKeyFromParams(key);

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

  async batchGetCache<T>(client, keys: string[]): Promise<T[]> {
    let profiler = new PerformanceProfiler();
    const chunks = this.getChunks(
      keys.map((key) => generateCacheKeyFromParams(key)),
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
  ) {
    let profiler = new PerformanceProfiler();
    try {
      const mapKeys = keys.map((key) => generateCacheKeyFromParams(key));
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

  async del(client: Redis.Redis, key: string): Promise<void> {
    const cacheKey = generateCacheKeyFromParams(key);
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

  async delMultiple(client: Redis.Redis, keys: string[]): Promise<void> {
    if (keys?.length > 0) {
      const redisKeys = keys.map((key) => generateCacheKeyFromParams(key));
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
  }

  async delByPattern(client: Redis.Redis, key: string): Promise<void> {
    const cacheKey = generateCacheKeyFromParams(key);
    let profiler = new PerformanceProfiler();
    try {
      const stream = client.scanStream({ match: `${cacheKey}*`, count: 10 });

      const dels = await new Promise((resolve, reject) => {
        let delKeys = [];
        stream.on('data', function (resultKeys) {
          delKeys = [...delKeys, ...resultKeys.map((key) => ['del', key])];
        });
        stream.on('end', () => {
          resolve(delKeys);
        });
        stream.on('error', (err) => {
          reject(err);
        });
      });

      const multi = client.multi(dels);
      await promisify(multi.exec).call(multi);
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
      this.logger.log(
        `Profiler duration for delByPattern for key ${key} - ${profiler.duration}`,
      );
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
  ): Promise<any> {
    const cachedData = await this.get(client, key);
    if (!isNil(cachedData)) {
      return cachedData;
    }
    const value = await this.buildInternalCreateValueFunc(key, createValueFunc);
    await this.set(client, key, value, ttl);

    return value;
  }

  async getOrSetWithDifferentTtl(
    client: Redis.Redis,
    key: string,
    createValueFunc: () => any,
  ): Promise<any> {
    const cachedData = await this.get(client, key);
    if (!isNil(cachedData)) {
      return cachedData;
    }
    const value = await this.buildInternalCreateValueFunc(key, createValueFunc);
    await this.set(client, key, value, value.ttl);

    return value;
  }

  async setOrUpdate(
    client: Redis.Redis,
    key: string,
    createValueFunc: () => any,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<any> {
    const value = await this.buildInternalCreateValueFunc(key, createValueFunc);
    await this.set(client, key, value, ttl);
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
  ): Promise<number> {
    const cacheKey = generateCacheKeyFromParams(key);

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
  ): Promise<number> {
    const cacheKey = generateCacheKeyFromParams(key);

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

  async addItemsToList(
    client: Redis.Redis,
    cacheKey: string,
    items: string[],
  ): Promise<void> {
    let profiler = new PerformanceProfiler();
    try {
      if (items?.length > 0) {
        await client.rpush(cacheKey, items);
      }
    } catch (err) {
      this.logger.error(
        `An error occurred while trying to add item to redis list ${cacheKey}. Exception: ${err?.toString()}.`,
      );
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('RPUSH', profiler.duration);
    }
  }

  async popAllItemsFromList(
    client: Redis.Redis,
    cacheKey: string,
    removeDuplicates: boolean = false,
  ): Promise<string[]> {
    let items: string[] = [];
    let profiler = new PerformanceProfiler();
    try {
      let item: string;
      while ((item = await client.lpop(cacheKey))) {
        items.push(item);
      }
    } catch (err) {
      this.logger.error(
        `An error occurred while trying to pop all item from redis list ${cacheKey}. Exception: ${err?.toString()}.`,
      );
    } finally {
      profiler.stop();
      MetricsCollector.setRedisDuration('LPOP', profiler.duration);
    }
    return removeDuplicates ? [...new Set(items)] : items;
  }

  private async buildInternalCreateValueFunc(
    key: string,
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
      });
      return null;
    }
  }

  private getClientDb(client: string): number {
    switch (client) {
      case cacheConfig.auctionsRedisClientName: {
        return cacheConfig.auctionsDbName;
      }
      case cacheConfig.assetsRedisClientName: {
        return cacheConfig.assetsDbName;
      }
      case cacheConfig.ordersRedisClientName: {
        return cacheConfig.ordersDbName;
      }
      case cacheConfig.persistentRedisClientName: {
        return cacheConfig.persistentDbName;
      }
      case cacheConfig.collectionsRedisClientName: {
        return cacheConfig.collectionsDbName;
      }
      case cacheConfig.rarityQueueClientName: {
        return cacheConfig.rarityQueueDbName;
      }
      case cacheConfig.traitsQueueClientName: {
        return cacheConfig.traitsQueueDbName;
      }
      default: {
        return 0;
      }
    }
  }
}
