import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { TimeConstants } from 'src/utils/time-utils';
import { RedisValue } from '../common/redis-value.dto';
import { BaseCollectionsAssetsRedisHandler } from './base-collection-assets.redis-handler';

@Injectable()
export class CollectionsTraitSummaryRedisHandler extends BaseCollectionsAssetsRedisHandler {
  protected redisClient: Redis.Redis;
  protected redisCacheService: RedisCacheService;
  constructor(
    redisCacheService: RedisCacheService,
    private apiService: ElrondApiService,
    private persistenceService: PersistenceService,
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
        traitsPromise: this.persistenceService.getTraitSummary(collection),
      };
    });

    let traitSummaries = await Promise.all(getTraitSummayPromises);
    let traitSummariesGroupByCollection: {
      [key: string]: { [key: string]: { [key: string]: number } };
    } = {};

    for (const traitSummary of traitSummaries) {
      traitSummariesGroupByCollection[traitSummary.collection] =
        (await traitSummary.traitsPromise).traitTypes ?? {};
    }
    return traitSummariesGroupByCollection;
  }
}
