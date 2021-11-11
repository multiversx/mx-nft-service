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
    private keyName: string,
    redisCacheService: RedisCacheService,
    private dataLoader: {
      load: (arg0: T) => any;
      clear: (arg0: T) => any;
      clearAll: () => any;
    },
  ) {
    this.redisCacheService = redisCacheService;
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async load(key: T): Promise<any> {
    const cacheKey = this.getCacheKey(key);
    const getLikesCount = () => this.dataLoader.load(key);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getLikesCount,
      cacheConfig.followersttl,
    );
  }

  async clearKey(key: T): Promise<any> {
    await this.redisCacheService.del(this.redisClient, this.getCacheKey(key));
    return this.dataLoader.clear(key);
  }

  async clearAll(): Promise<any> {
    return this.dataLoader.clearAll();
  }

  getCacheKeys(key: T[]) {
    return key.map((id) => this.getCacheKey(id));
  }

  getCacheKey(key: T) {
    return generateCacheKeyFromParams(this.keyName, key);
  }
}
