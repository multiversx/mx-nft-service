import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisDataloaderHandler } from 'src/modules/common/redis-dataloader.handler';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class CollectionAssetsCountRedisHandler extends RedisDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'collectionAssetsCount', TimeConstants.oneDay);
  }

  mapValues(
    collectionIdentifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return collectionIdentifiers.map((identifier) => {
      return assetsIdentifiers[identifier][0]?.totalCount || 0;
    });
  }
}
