import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';
import { CollectionAssetModel } from '../models';

@Injectable()
export class CollectionAssetsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      redisCacheService,
      'collectionAssets',
      cacheConfig.collectionsRedisClientName,
    );
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key]
          ? assetsIdentifiers[item.key].map((a) =>
              CollectionAssetModel.fromNft(a),
            )
          : [];
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: 30 * TimeConstants.oneSecond,
      }),
    ];
  }
}
