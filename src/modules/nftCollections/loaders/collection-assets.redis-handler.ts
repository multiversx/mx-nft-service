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
    let response: RedisValue[] = [];
    const defaultNfts = [];
    const finalNfts = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key]
          ? assetsIdentifiers[item.key].map((a) =>
              CollectionAssetModel.fromNft(a),
            )
          : [];
        if (this.hasDefaultThumbnail(item)) {
          defaultNfts.push(item);
        } else {
          finalNfts.push(item);
        }
      }
    }

    response = [
      ...response,
      new RedisValue({ values: finalNfts, ttl: TimeConstants.oneDay }),
      new RedisValue({ values: defaultNfts, ttl: TimeConstants.oneMinute }),
    ];
    return response;
  }

  private hasDefaultThumbnail(item: { key: string; value: any }) {
    return (
      item.value &&
      item.value.filter((i) => i.thumbnailUrl.includes('default')).length > 0
    );
  }
}
