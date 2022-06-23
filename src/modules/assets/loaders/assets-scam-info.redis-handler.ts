import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { TimeConstants } from 'src/utils/time-utils';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';

@Injectable()
export class AssetScamInfoRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset_scam_info');
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key]
          ? assetsIdentifiers[item.key][0]?.scamInfo
          : { key: item.key };
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: 30 * TimeConstants.oneMinute,
      }),
    ];
  }

  batchScamInfo = async (keys: string[], data: any) => {
    const cacheKeys = this.getCacheKeys(keys);
    const getDataFromRedis: { key: string; value: any }[] =
      await this.redisCacheService.batchGetCache(this.redisClient, cacheKeys);
    const returnValues: { key: string; value: any }[] =
      this.mapReturnValues<string>(keys, getDataFromRedis);
    const getNotCachedKeys = returnValues
      .filter((item) => item.value === null)
      .map((value) => value.key);
    if (getNotCachedKeys?.length > 0) {
      const redisValues = this.mapValues(returnValues, data);

      for (const val of redisValues) {
        const cacheKeys = this.getCacheKeys(
          val.values.map((value) => value.key),
        );
        await this.redisCacheService.batchSetCache(
          this.redisClient,
          cacheKeys,
          val.values,
          5 * TimeConstants.oneMinute,
        );
      }
      return returnValues;
    }
    return getDataFromRedis;
  };
}
