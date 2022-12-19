import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@elrondnetwork/erdnest';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';
import { LocalRedisCacheService } from 'src/common';

@Injectable()
export abstract class RedisValueDataloaderHandler<T> {
  protected redisCacheService: RedisCacheService;
  protected localRedisCacheService: LocalRedisCacheService;
  private cacheKeyName: string;
  constructor(
    redisCacheService: RedisCacheService,
    cacheKeyName: string,
    localRedisCacheService: LocalRedisCacheService,
    private ttl: number = TimeConstants.oneWeek,
  ) {
    this.cacheKeyName = cacheKeyName;
    this.redisCacheService = redisCacheService;
    this.localRedisCacheService = localRedisCacheService;
  }
  abstract mapValues(keys: T[], dataKeys): any;

  async clearKey(key: T): Promise<any> {
    await this.redisCacheService.delete(this.getCacheKey(key));
  }

  async clearKeyByPattern(key: T): Promise<any> {
    await this.localRedisCacheService.delByPattern(this.getCacheKey(key));
  }

  batchLoad = async (keys: T[], createValueFunc: () => any) => {
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
