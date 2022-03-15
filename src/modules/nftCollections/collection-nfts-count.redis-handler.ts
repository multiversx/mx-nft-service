import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { AssetsQuery } from '../assets/assets-query';
import { BaseCollectionsAssetsRedisHandler } from './base-collection-assets.redis-handler';

@Injectable()
export class CollectionsNftsCountRedisHandler extends BaseCollectionsAssetsRedisHandler {
  protected redisClient: Redis.Redis;
  protected redisCacheService: RedisCacheService;
  constructor(
    redisCacheService: RedisCacheService,
    private apiService: ElrondApiService,
  ) {
    super(redisCacheService, 'collectionAssetsCount');
  }
  mapValues(returnValues: { key: string; value: any }[], data: any) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = data[item.key][0].value;
        redisValues.push(item);
      }
    }

    return redisValues;
  }

  async getData(keys: string[]) {
    const getCountPromises = keys.map((identifier) =>
      this.apiService.getNftsCountForCollection(
        this.getQueryForCollection(identifier),
        identifier,
      ),
    );

    const nftsCountResponse = await Promise.all(getCountPromises);
    return nftsCountResponse?.groupBy((item) => item.key);
  }

  private getQueryForCollection(identifier: string): string {
    return new AssetsQuery().addCollection(identifier).build();
  }
}
