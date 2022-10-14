import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common';
import { TimeConstants } from 'src/utils/time-utils';
import { RedisValue } from '../common/redis-value.dto';
import { CollectionNftTrait } from '../nft-traits/models/collection-traits.model';
import { BaseCollectionsAssetsRedisHandler } from './base-collection-assets.redis-handler';
import { CollectionsGetterService } from './collections-getter.service';

@Injectable()
export class CollectionsTraitSummaryRedisHandler extends BaseCollectionsAssetsRedisHandler {
  protected redisClient: Redis.Redis;
  protected redisCacheService: RedisCacheService;
  constructor(
    redisCacheService: RedisCacheService,
    @Inject(forwardRef(() => CollectionsGetterService))
    private collectionsGetterService: CollectionsGetterService,
  ) {
    super(redisCacheService, 'collectionTraitSummary');
  }
  mapValues(
    returnValues: { key: string; value: any }[],
    data: { [key: string]: any[] },
  ): RedisValue[] {
    let response: RedisValue[] = [];
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = data[item.key] ?? [];
        redisValues.push(item);
      }
    }
    response = [
      ...response,
      new RedisValue({ values: redisValues, ttl: TimeConstants.oneDay }),
    ];
    return response;
  }

  async getData(keys: string[]) {
    let getTraitSummayPromises = keys.map((collection) => {
      return {
        collection,
        traitsPromise:
          this.collectionsGetterService.getCollectionTraits(collection),
      };
    });

    let traitSummaries = await Promise.all(getTraitSummayPromises);
    let traitSummariesGroupByCollection: {
      [key: string]: CollectionNftTrait[];
    } = {};

    for (const traitSummary of traitSummaries) {
      traitSummariesGroupByCollection[traitSummary.collection] =
        await traitSummary.traitsPromise;
    }
    return traitSummariesGroupByCollection;
  }
}
