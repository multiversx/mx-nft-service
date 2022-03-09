import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisDataloaderHandler } from 'src/modules/common/redis-dataloader.handler';
import { TimeConstants } from 'src/utils/time-utils';
import { CollectionAssetModel } from '../models';

@Injectable()
export class CollectionAssetsRedisHandler extends RedisDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'collectionAssets', TimeConstants.oneDay);
  }

  mapValues(
    collectionIdentifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return collectionIdentifiers.map((identifier) => {
      return assetsIdentifiers[identifier]
        ? {
            key: identifier,
            value: assetsIdentifiers[identifier].map((a) =>
              CollectionAssetModel.fromNft(a),
            ),
          }
        : { key: identifier, value: [] };
    });
  }
}
