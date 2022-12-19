import { RedisCacheService } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { MxApiService } from 'src/common';
import { LocalRedisCacheService } from 'src/common/services/caching/local-redis-cache.service';
import { TimeConstants } from 'src/utils/time-utils';
import { AssetsQuery } from '../assets/assets-query';
import { RedisValue } from '../common/redis-value.dto';
import { BaseCollectionsAssetsRedisHandler } from './base-collection-assets.redis-handler';

@Injectable()
export class CollectionsNftsCountRedisHandler extends BaseCollectionsAssetsRedisHandler {
  protected redisClient: Redis.Redis;
  protected redisCacheService: RedisCacheService;
  constructor(
    redisCacheService: RedisCacheService,
    private apiService: MxApiService,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    super(redisCacheService, 'collectionAssetsCount', localRedisCacheService);
  }
  mapValues(
    returnValues: { key: string; value: any }[],
    data: any,
  ): RedisValue[] {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = data[item.key][0].value;
        redisValues.push(item);
      }
    }
    return [new RedisValue({ values: redisValues, ttl: TimeConstants.oneDay })];
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
