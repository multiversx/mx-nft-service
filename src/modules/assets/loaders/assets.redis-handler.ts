import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';
import { Asset, NftTypeEnum } from '../models';

@Injectable()
export class AssetsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset');
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
          ? Asset.fromNft(assetsIdentifiers[item.key][0])
          : null;
        if (this.hasDefaultThumbnailOrNoOwner(item)) {
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

  private hasDefaultThumbnailOrNoOwner(item: { key: string; value: any }) {
    return (
      (item.value &&
        item.value.media &&
        item.value.media[0].thumbnailUrl.includes('default')) ||
      (item.value &&
        item.value.type === NftTypeEnum.NonFungibleESDT &&
        !item.value.owner)
    );
  }
}
