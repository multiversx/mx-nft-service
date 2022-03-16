import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisDataloaderHandler } from 'src/modules/common/redis-dataloader.handler';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class AssetsOwnerRedisHandler extends RedisDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset_owner', 5);
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

  public batchOwner = async (identifiers: string[], data: any) => {
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
