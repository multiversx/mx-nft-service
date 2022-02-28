import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export abstract class RedisDataloaderHandler<T> {
  protected redisClient: Redis.Redis;
  protected redisCacheService: RedisCacheService;
  private cacheKeyName: string;
  constructor(
    redisCacheService: RedisCacheService,
    cacheKeyName: string,
    private ttl: number = TimeConstants.oneWeek,
  ) {
    this.cacheKeyName = cacheKeyName;
    this.redisCacheService = redisCacheService;
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }
  abstract mapValues(keys: T[], dataKeys): any;

  async clearKey(key: T): Promise<any> {
    await this.redisCacheService.del(this.redisClient, this.getCacheKey(key));
  }

  async clearKeyByPattern(key: T): Promise<any> {
    await this.redisCacheService.delByPattern(
      this.redisClient,
      this.getCacheKey(key),
    );
  }

  batchLoad = async (keys: T[], createValueFunc: () => any) => {
    const cacheKeys = this.getCacheKeys(keys);
    let [redisKeys, values] = [cacheKeys, []];
    const getDataFromRedis = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getDataFromRedis.includes(null)) {
      let data = createValueFunc();
      if (data instanceof Promise) {
        data = await data;
      }
      values = this.mapValues(keys, data);
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
