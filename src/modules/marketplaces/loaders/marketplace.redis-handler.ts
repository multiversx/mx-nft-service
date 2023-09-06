import { Injectable } from '@nestjs/common';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';

@Injectable()
export class MarketplaceRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'marketplace');
  }

  mapValues(returnValues: { key: string; value: any }[], marketplaceKeys: { [key: string]: any[] }): RedisValue[] {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = marketplaceKeys[item.key];
        redisValues.push(item);
      }
    }
    return [new RedisValue({ values: redisValues, ttl: Constants.oneWeek() })];
  }
}
