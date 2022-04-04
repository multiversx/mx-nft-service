import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class AssetsSupplyRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset_supply');
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value =
          assetsIdentifiers && assetsIdentifiers[item.key]
            ? assetsIdentifiers[item.key][0]?.supply
            : null;
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: 5 * TimeConstants.oneSecond,
      }),
    ];
  }

  public batchSupplyInfo = async (identifiers: string[], data: any) => {
    const cacheKeys = this.getCacheKeys(identifiers);
    let [redisKeys, values] = [cacheKeys, []];
    const getDataFromRedis = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getDataFromRedis.includes(null)) {
      values = identifiers.map((identifier) =>
        data && data[identifier] ? data[identifier] : null,
      );
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        redisKeys,
        values,
        5 * TimeConstants.oneSecond,
      );
      return values;
    }
    return getDataFromRedis;
  };
}
