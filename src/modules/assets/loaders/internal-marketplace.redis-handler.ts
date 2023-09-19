import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { Marketplace } from 'src/modules/marketplaces/models/Marketplace.dto';

@Injectable()
export class InternalMarketplaceRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'internal_marketplace');
  }

  mapValues(returnValues: { key: string; value: any }[], collectionIdentifiers: { [key: string]: Marketplace[] }) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = collectionIdentifiers[item.key] ? collectionIdentifiers[item.key][0] : {};
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: 30 * Constants.oneMinute(),
      }),
    ];
  }
}
