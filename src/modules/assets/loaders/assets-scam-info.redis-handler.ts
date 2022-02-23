import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { ScamInfo } from '../models/ScamInfo.dto';
import { RedisDataloaderHandler } from 'src/modules/common/redis-dataloader.handler';

@Injectable()
export class AssetScamInfoRedisHandler extends RedisDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset_scam_info', 1800);
  }

  mapValues(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers.map((identifier) => {
      return ScamInfo.fromNftScamInfo(
        assetsIdentifiers[identifier][0].scamInfo,
      );
    });
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
        300,
      );
      return values;
    }
    return getDataFromRedis;
  };
}
