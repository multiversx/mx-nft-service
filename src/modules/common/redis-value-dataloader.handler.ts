import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

@Injectable()
export abstract class RedisValueDataloaderHandler<T> {
  protected redisCacheService: RedisCacheService;
  private cacheKeyName: string;
  constructor(redisCacheService: RedisCacheService, cacheKeyName: string, private ttl: number = Constants.oneWeek()) {
    this.cacheKeyName = cacheKeyName;
    this.redisCacheService = redisCacheService;
  }
  abstract mapValues(keys: T[], dataKeys): any;

  async clearKey(key: T): Promise<any> {
    await this.redisCacheService.delete(this.getCacheKey(key));
  }

  async clearKeyByPattern(key: T): Promise<any> {
    this.redisCacheService.deleteByPattern(`${this.getCacheKey(key)}*`);
  }

  batchLoad = async (keys: T[], createValueFunc: () => any) => {
    if (!keys || keys.length === 0) return;
    const cacheKeys = this.getCacheKeys(keys);
    let [redisKeys, values] = [cacheKeys, []];
    const getDataFromRedis = await this.redisCacheService.getMany(cacheKeys);
    if (getDataFromRedis.includes(null)) {
      let data = createValueFunc();
      if (data instanceof Promise) {
        data = await data;
      }
      values = this.mapValues(keys, data);
      await this.redisCacheService.setMany(redisKeys, values, this.ttl);
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
