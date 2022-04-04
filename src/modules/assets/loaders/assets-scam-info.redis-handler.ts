import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { ScamInfo } from '../models/ScamInfo.dto';
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
        item.value = assetsIdentifiers[item.key][0].scamInfo;
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

  public batchScamInfo = async (identifiers: string[], data: any) => {
    const cacheKeys = this.getCacheKeys(identifiers);
    let [redisKeys, values] = [cacheKeys, []];
    const getDataFromRedis = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getDataFromRedis.includes(null)) {
      values = identifiers.map((identifier) => {
        return ScamInfo.fromNftScamInfo(data[identifier][0].scamInfo);
      });

      await this.redisCacheService.batchSetCache(
        this.redisClient,
        redisKeys,
        values,
        5 * TimeConstants.oneMinute,
      );
      return values;
    }
    return getDataFromRedis;
  };
}
