import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { RedisValue } from './redis-value.dto';

@Injectable()
export abstract class RedisKeyValueDataloaderHandler<T> {
  protected redisClient: Redis.Redis;
  protected redisCacheService: RedisCacheService;
  private cacheKeyName: string;
  constructor(
    redisCacheService: RedisCacheService,
    cacheKeyName: string,
    redisClientName = cacheConfig.persistentRedisClientName,
  ) {
    this.cacheKeyName = cacheKeyName;
    this.redisCacheService = redisCacheService;
    this.redisClient = this.redisCacheService.getClient(redisClientName);
  }
  abstract mapValues(keys: { key: T; value: any }[], dataKeys): RedisValue[];

  async clearKey(key: T): Promise<any> {
    await this.redisCacheService.del(this.redisClient, this.getCacheKey(key));
  }

  async clearMultipleKeys(keys: T[]): Promise<any> {
    await this.redisCacheService.delMultiple(
      this.redisClient,
      keys.map((key) => this.getCacheKey(key)),
    );
  }

  async clearKeyByPattern(key: T): Promise<any> {
    await this.redisCacheService.delByPattern(
      this.redisClient,
      this.getCacheKey(key),
    );
  }

  batchLoad = async (keys: T[], createValueFunc: () => any) => {
    const cacheKeys = this.getCacheKeys(keys);
    const getDataFromRedis: { key: T; value: any }[] =
      await this.redisCacheService.batchGetCache(this.redisClient, cacheKeys);
    const returnValues: { key: T; value: any }[] = this.mapReturnValues<T>(
      keys,
      getDataFromRedis,
    );
    const getNotCachedKeys = returnValues
      .filter((item) => item.value === null)
      .map((value) => value.key);
    if (getNotCachedKeys?.length > 0) {
      let data = await createValueFunc();
      const redisValues = this.mapValues(returnValues, data);

      for (const val of redisValues) {
        const cacheKeys = this.getCacheKeys(
          val.values.map((value) => value.key),
        );
        await this.redisCacheService.batchSetCache(
          this.redisClient,
          cacheKeys,
          val.values,
          val.ttl,
        );
      }
      return returnValues;
    }
    return getDataFromRedis;
  };

  getCacheKeys(key: T[]) {
    return key.map((id) => this.getCacheKey(id));
  }

  getCacheKey(key: T) {
    return generateCacheKeyFromParams(this.cacheKeyName, key);
  }

  protected mapReturnValues<T>(
    keys: T[],
    getDataFromRedis: { key: T; value: any }[],
  ) {
    const returnValues: { key: T; value: any }[] = [];
    for (let index = 0; index < keys.length; index++) {
      if (getDataFromRedis[index]) {
        returnValues.push(getDataFromRedis[index]);
      } else {
        returnValues.push({
          key: keys[index],
          value: getDataFromRedis[index]?.value ?? null,
        });
      }
    }

    return returnValues;
  }
}
