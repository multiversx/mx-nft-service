import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { AssetsQuery } from '../assets/assets-query';
import { BaseCollectionsAssetsRedisHandler } from './base-collection-assets.redis-handler';
import { CollectionAssetModel } from './models/CollectionAsset.dto';

@Injectable()
export class CollectionsNftsRedisHandler extends BaseCollectionsAssetsRedisHandler {
  protected redisClient: Redis.Redis;
  protected redisCacheService: RedisCacheService;
  constructor(
    redisCacheService: RedisCacheService,
    private apiService: ElrondApiService,
  ) {
    super(redisCacheService, 'collectionAssets');
  }
  mapValues(returnValues: { key: string; value: any }[], data: any) {
    returnValues.forEach((item) => {
      if (item.value === null)
        item.value = data[item.key].map((a) => CollectionAssetModel.fromNft(a));
    });
    return returnValues;
  }

  async getData(keys: string[]) {
    let getNftsPromises = keys.map((collection) =>
      this.apiService.getAllNfts(
        `${this.getQueryForCollection(
          collection,
        )}&fields=media,identifier,collection`,
      ),
    );

    let nftsResponse = await Promise.all(getNftsPromises);
    let nftsGroupByCollection: { [key: string]: any[] } = {};

    for (const nfts of nftsResponse) {
      nftsGroupByCollection[nfts[0]?.collection] = nfts;
    }
    return nftsGroupByCollection;
  }

  private getQueryForCollection(identifier: string): string {
    return new AssetsQuery()
      .addCollection(identifier)
      .addPageSize(0, 4)
      .build();
  }
}
