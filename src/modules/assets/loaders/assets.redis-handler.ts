import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';

import { Asset, NftTypeEnum } from '../models';

@Injectable()
export class AssetsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset');
  }

  mapValues(returnValues: { key: string; value: any }[], assetsIdentifiers: { [key: string]: any[] }) {
    let response: RedisValue[] = [];
    const defaultNfts = [];
    const finalNfts = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key] ? Asset.fromNft(assetsIdentifiers[item.key][0]) : null;
        if (this.hasDefaultThumbnailOrNoOwner(item)) {
          defaultNfts.push(item);
        } else {
          finalNfts.push(item);
        }
      }
    }

    response = [
      ...response,
      new RedisValue({ values: finalNfts, ttl: Constants.oneDay() }),
      new RedisValue({ values: defaultNfts, ttl: Constants.oneMinute() }),
    ];
    return response;
  }

  private hasDefaultThumbnailOrNoOwner(item: { key: string; value: any }) {
    return (
      (item.value && item.value.media && item.value.media[0].thumbnailUrl.includes('default')) ||
      (item.value && item.value.type === NftTypeEnum.NonFungibleESDT && !item.value.owner)
    );
  }
}
