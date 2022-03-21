import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisDataloaderHandler } from 'src/modules/common/redis-dataloader.handler';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class AssetsViewsRedisHandler extends RedisDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset_views', 3 * TimeConstants.oneMinute);
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
}
