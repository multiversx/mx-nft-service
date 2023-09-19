import { Injectable } from '@nestjs/common';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';

@Injectable()
export class LastOrderRedisHandler extends RedisKeyValueDataloaderHandler<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'auction_active_orders');
  }

  mapValues(returnValues: { key: number; value: any }[], ordersAuctionsIds: { [key: string]: any[] }): RedisValue[] {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = ordersAuctionsIds[item.key];
        redisValues.push(item);
      }
    }
    return [new RedisValue({ values: redisValues, ttl: Constants.oneWeek() })];
  }
}
