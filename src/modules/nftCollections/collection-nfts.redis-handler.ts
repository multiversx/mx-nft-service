import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { TimeConstants } from 'src/utils/time-utils';
import { AssetsQuery } from '../assets/assets-query';
import { RedisValue } from '../common/redis-value.dto';
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
  mapValues(
    returnValues: { key: string; value: any }[],
    data: any,
  ): RedisValue[] {
    let response: RedisValue[] = [];
    const defaultNfts = [];
    const finalNfts = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = data[item.key]
          ? data[item.key].map((a) => CollectionAssetModel.fromNft(a))
          : null;
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
