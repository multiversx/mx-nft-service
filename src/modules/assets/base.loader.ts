import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';

@Injectable({
  scope: Scope.Operation,
})
export abstract class BaseProvider<T> {
  protected redisClient: Redis.Redis;
  protected redisCacheService: RedisCacheService;

  constructor(
    private cacheKeyName: string,
    redisCacheService: RedisCacheService,
    private dataLoader: {
      load: (arg0: T) => any;
      clear: (arg0: T) => any;
      clearAll: () => any;
    },
    private ttl: number = cacheConfig.followersttl,
  ) {
    this.redisCacheService = redisCacheService;
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  abstract mapValuesForRedis(identifiers: T[], assetsIdentifiers): any;

  abstract getDataFromDb(identifiers: T[]): Promise<any[]>;

  async load(key: T): Promise<any> {
    const cacheKey = this.getCacheKey(key);
    const getLikesCount = () => this.dataLoader.load(key);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getLikesCount,
      this.ttl,
    );
  }

  async clearKey(key: T): Promise<any> {
    await this.redisCacheService.del(this.redisClient, this.getCacheKey(key));
    return this.dataLoader.clear(key);
  }

  async clearAll(): Promise<any> {
    return this.dataLoader.clearAll();
  }

  batchLoad = async (keys: T[]) => {
    const cacheKeys = this.getCacheKeys(keys);
    let [redisKeys, values] = [cacheKeys, []];
    const getDataFromRedis = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getDataFromRedis.includes(null)) {
      const dataKeys = await this.getDataFromDb(keys);
      values = this.mapValuesForRedis(keys, dataKeys);
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        redisKeys,
        values,
        this.ttl,
      );
      return values;
    }
    return getDataFromRedis;
  };

  getCacheKeys(key: T[]) {
    return key.map((id) => this.getCacheKey(id));
  }

  getCacheKey(key: T) {
    return generateCacheKeyFromParams(this.cacheKeyName, key);
  }
}
