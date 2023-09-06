import { Injectable } from '@nestjs/common';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { NftTypeEnum } from 'src/modules/assets/models';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { CollectionAssetModel } from '../models';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

@Injectable()
export class CollectionAssetsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, CacheInfo.CollectionAssets.key);
  }

  mapValues(returnValues: { key: string; value: any }[], assetsIdentifiers: { [key: string]: any[] }) {
    let response: RedisValue[] = [];
    const defaultNfts = [];
    const finalNfts = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key] ? assetsIdentifiers[item.key].map((a) => CollectionAssetModel.fromNft(a)) : [];
        if (this.hasDefaultThumbnailOrNoOwner(item)) {
          defaultNfts.push(item);
        } else {
          finalNfts.push(item);
        }
      }
    }

    response = [
      ...response,
      new RedisValue({
        values: finalNfts,
        ttl: CacheInfo.CollectionAssets.ttl,
      }),
      new RedisValue({ values: defaultNfts, ttl: Constants.oneMinute() }),
    ];
    return response;
  }

  private hasDefaultThumbnailOrNoOwner(item: { key: string; value: any }) {
    return (
      (item.value && item.value.filter((i) => i.thumbnailUrl.includes('default')).length > 0) ||
      (item.value && item.value.type === NftTypeEnum.NonFungibleESDT && !item.value.owner)
    );
  }
}
