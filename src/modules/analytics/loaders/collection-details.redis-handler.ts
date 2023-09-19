import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Injectable } from '@nestjs/common';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { CollectionsDetailsModel } from '../models/collections-details.model';

@Injectable()
export class CollectionDetailsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, CacheInfo.CollectionDetails.key);
  }

  mapValues(returnValues: { key: string; value: any }[], collections: { [key: string]: any[] }) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = collections[item.key] ? CollectionsDetailsModel.fromApiCollection(collections[item.key][0]) : null;
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: CacheInfo.CollectionDetails.ttl,
      }),
    ];
  }
}
