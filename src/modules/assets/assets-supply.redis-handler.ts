import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { ScamInfo } from './models/ScamInfo.dto';
import { RedisDataloaderHandler } from './redis-dataloader.handler';

@Injectable()
export class AssetsSupplyRedisHandler extends RedisDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset_supply', 5);
  }

  mapValues(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers.map((identifier) =>
      assetsIdentifiers && assetsIdentifiers[identifier]
        ? assetsIdentifiers[identifier]
        : null,
    );
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
      console.log('batchSupplyInfo', values);
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        redisKeys,
        values,
        5,
      );
      return values;
    }
    return getDataFromRedis;
  };
}
