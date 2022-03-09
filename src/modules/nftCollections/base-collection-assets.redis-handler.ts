import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export abstract class BaseCollectionsAssetsRedisHandler {
  protected redisClient: Redis.Redis;
  protected redisCacheService: RedisCacheService;
  private cacheKeyName: string;
  constructor(redisCacheService: RedisCacheService, cacheKeyName: string) {
    this.cacheKeyName = cacheKeyName;
    this.redisCacheService = redisCacheService;
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.collectionsRedisClientName,
    );
  }
  protected abstract mapValues(
    keys: { key: string; value: any }[],
    dataKeys,
  ): any;
  protected abstract getData(keys: string[]): any;

  async batchLoad(keys: string[]) {
    const cacheKeys = this.getCacheKeys(keys);
    let [redisKeys, values] = [cacheKeys, []];
    const getDataFromRedis = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    const returnValues: { key: string; value: any }[] = [];
    for (let index = 0; index < keys.length; index++) {
      returnValues.push({
        key: keys[index],
        value: getDataFromRedis[index],
      });
    }

    const getNotCachedKeys = returnValues
      .filter((item) => item.value === null)
      .map((value) => value.key);
    if (getNotCachedKeys?.length > 0) {
      let data = await this.getData(getNotCachedKeys);

      values = this.mapValues(returnValues, data);

      await this.redisCacheService.batchSetCache(
        this.redisClient,
        redisKeys,
        values,
        TimeConstants.oneDay,
      );
      return values;
    }
    return getDataFromRedis;
  }

  async clearKey(key: string): Promise<any> {
    await this.redisCacheService.del(this.redisClient, this.getCacheKey(key));
  }

  async clearKeyByPattern(key: string): Promise<any> {
    await this.redisCacheService.delByPattern(
      this.redisClient,
      this.getCacheKey(key),
    );
  }

  private getCacheKeys(key: string[]) {
    return key.map((id) => this.getCacheKey(id));
  }

  private getCacheKey(key: string) {
    return generateCacheKeyFromParams(this.cacheKeyName, key);
  }
}
