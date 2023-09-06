import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { AssetsQuery } from '../assets/assets-query';
import { NftTypeEnum } from '../assets/models';
import { RedisValue } from '../common/redis-value.dto';
import { BaseCollectionsAssetsRedisHandler } from './base-collection-assets.redis-handler';
import { CollectionAssetModel } from './models/CollectionAsset.dto';

@Injectable()
export class CollectionsNftsRedisHandler extends BaseCollectionsAssetsRedisHandler {
  protected redisCacheService: RedisCacheService;
  constructor(redisCacheService: RedisCacheService, private apiService: MxApiService) {
    super(redisCacheService, CacheInfo.CollectionNfts.key);
  }
  mapValues(returnValues: { key: string; value: any }[], assetsIdentifiers: { [key: string]: any[] }): RedisValue[] {
    let response: RedisValue[] = [];
    const defaultNfts = [];
    const finalNfts = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key] ? assetsIdentifiers[item.key].map((a) => CollectionAssetModel.fromNft(a)) : null;
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
        ttl: CacheInfo.CollectionNfts.ttl,
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

  async getData(keys: string[]) {
    let getNftsPromises = keys.map((collection) => {
      const query = new AssetsQuery()
        .addCollection(collection)
        .addPageSize(0, 10)
        .addFields(['media', 'identifier', 'collection', 'isNsfw', 'scamInfo'])
        .build();
      return this.apiService.getAllNfts(query);
    });

    let nftsResponse = await Promise.all(getNftsPromises);
    let nftsGroupByCollection: { [key: string]: any[] } = {};

    for (const nfts of nftsResponse) {
      nftsGroupByCollection[nfts?.[0]?.collection] = nfts;
    }
    return nftsGroupByCollection;
  }
}
