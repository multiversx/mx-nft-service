import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';

@Injectable()
export class AssetsSupplyRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset_supply');
  }

  mapValues(returnValues: { key: string; value: any }[], assetsIdentifiers: { [key: string]: any[] }) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers && assetsIdentifiers[item.key] ? assetsIdentifiers[item.key][0]?.supply : null;
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: 5 * Constants.oneSecond(),
      }),
    ];
  }

  batchSupplyInfo = async (keys: string[], data: any) => {
    const cacheKeys = this.getCacheKeys(keys);
    const getDataFromRedis: { key: string; value: any }[] = await this.redisCacheService.getMany(cacheKeys);
    const returnValues: { key: string; value: any }[] = this.mapReturnValues<string>(keys, getDataFromRedis);
    const getNotCachedKeys = returnValues.filter((item) => item.value === null).map((value) => value.key);
    if (getNotCachedKeys?.length > 0) {
      const redisValues = this.mapValues(returnValues, data);

      for (const val of redisValues) {
        const cacheKeys = this.getCacheKeys(val.values.map((value) => value.key));
        await this.redisCacheService.setMany(cacheKeys, val.values, val.ttl);
      }
      return returnValues;
    }
    return getDataFromRedis;
  };
}
