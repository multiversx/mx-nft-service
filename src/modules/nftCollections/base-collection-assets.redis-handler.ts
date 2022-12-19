import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@elrondnetwork/erdnest';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { RedisValue } from '../common/redis-value.dto';
import { LocalRedisCacheService } from 'src/common';

@Injectable()
export abstract class BaseCollectionsAssetsRedisHandler {
  protected redisCacheService: RedisCacheService;
  protected localRedisCacheService: LocalRedisCacheService;
  private cacheKeyName: string;
  constructor(
    redisCacheService: RedisCacheService,
    cacheKeyName: string,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    this.cacheKeyName = cacheKeyName;
    this.redisCacheService = redisCacheService;
    this.localRedisCacheService = localRedisCacheService;
  }
  protected abstract mapValues(
    returnValues: { key: string; value: any }[],
    dataKeys,
  ): RedisValue[];
  protected abstract getData(keys: string[]): any;

  async batchLoad(keys: string[]) {
    const cacheKeys = this.getCacheKeys(keys);
    const getDataFromRedis: { key: string; value: any }[] =
      await this.redisCacheService.getMany(cacheKeys);
    const returnValues: { key: string; value: any }[] = this.mapReturnValues(
      keys,
      getDataFromRedis,
    );
    const getNotCachedKeys = returnValues
      .filter((item) => item.value === null)
      .map((value) => value.key);

    if (getNotCachedKeys?.length > 0) {
      let data = await this.getData(getNotCachedKeys);

      const redisValues = this.mapValues(returnValues, data);
      for (const val of redisValues) {
        const cacheKeys = this.getCacheKeys(
          val.values.map((value) => value.key),
        );
        await this.redisCacheService.setMany(cacheKeys, val.values, val.ttl);
      }
      return returnValues;
    }
    return getDataFromRedis;
  }

  private mapReturnValues(
    keys: string[],
    getDataFromRedis: { key: string; value: any }[],
  ) {
    const returnValues: { key: string; value: any }[] = [];
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

  async clearKey(key: string): Promise<any> {
    await this.redisCacheService.delete(this.getCacheKey(key));
  }

  async clearKeyByPattern(key: string): Promise<any> {
    await this.localRedisCacheService.delByPattern(this.getCacheKey(key));
  }

  private getCacheKeys(key: string[]) {
    return key.map((id) => this.getCacheKey(id));
  }

  private getCacheKey(key: string) {
    return generateCacheKeyFromParams(this.cacheKeyName, key);
  }
}
