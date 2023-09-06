import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Injectable, Logger } from '@nestjs/common';
import { UnableToLoadError } from 'src/common/models/errors/unable-to-load-error';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { RedisValue } from './redis-value.dto';

@Injectable()
export abstract class RedisKeyValueDataloaderHandler<T> {
  protected redisCacheService: RedisCacheService;
  private readonly logger: Logger;
  private cacheKeyName: string;
  constructor(redisCacheService: RedisCacheService, cacheKeyName: string) {
    this.cacheKeyName = cacheKeyName;
    this.redisCacheService = redisCacheService;
    this.logger = new Logger(RedisKeyValueDataloaderHandler.name);
  }
  abstract mapValues(keys: { key: T; value: any }[], dataKeys): RedisValue[];

  async clearKey(key: T): Promise<any> {
    await this.redisCacheService.delete(this.getCacheKey(key));
  }

  async clearMultipleKeys(keys: T[]): Promise<any> {
    await this.redisCacheService.deleteMany(keys.map((key) => this.getCacheKey(key)));
  }

  async clearKeyByPattern(key: T): Promise<any> {
    await this.redisCacheService.deleteByPattern(`${this.getCacheKey(key)}*`);
  }

  batchLoad = async (keys: T[], createValueFunc: () => any) => {
    try {
      if (!keys || keys.length === 0) return;
      const cacheKeys = this.getCacheKeys(keys);
      const getDataFromRedis: { key: T; value: any }[] = await this.redisCacheService.getMany(cacheKeys);
      const returnValues: { key: T; value: any }[] = this.mapReturnValues<T>(keys, getDataFromRedis);
      const getNotCachedKeys = returnValues.filter((item) => item.value === null).map((value) => value.key);
      if (getNotCachedKeys?.length > 0) {
        let data = await createValueFunc();
        const redisValues = this.mapValues(returnValues, data);

        for (const val of redisValues) {
          if (val.values?.length > 0) {
            const cacheKeys = this.getCacheKeys(val.values.map((value) => value.key));
            await this.redisCacheService.setMany(cacheKeys, val.values, val.ttl);
          }
        }
        return returnValues;
      }
      return getDataFromRedis;
    } catch (error) {
      this.logger.error(
        `An error has ocurred while trying to resolve data for cacheKey: ${this.cacheKeyName} values: ${keys} ${this.cacheKeyName}`,
        {
          path: 'RedisKeyValueDataloaderHandler.batchLoad',
          exception: error?.message,
        },
      );
      throw new UnableToLoadError(
        `An error has ocurred while trying to resolve data for cacheKey: ${this.cacheKeyName} values: ${keys} ${this.cacheKeyName}`,
      );
    }
  };

  getCacheKeys(key: T[]) {
    return key.map((id) => this.getCacheKey(id));
  }

  getCacheKey(key: T) {
    return generateCacheKeyFromParams(this.cacheKeyName, key);
  }

  protected mapReturnValues<T>(keys: T[], getDataFromRedis: { key: T; value: any }[]) {
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
