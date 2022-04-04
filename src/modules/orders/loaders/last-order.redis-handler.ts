import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class LastOrderRedisHandler extends RedisKeyValueDataloaderHandler<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'auction_active_orders');
  }

  mapValues(
    returnValues: { key: number; value: any }[],
    ordersAuctionsIds: { [key: string]: any[] },
  ): RedisValue[] {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = ordersAuctionsIds[item.key];
        redisValues.push(item);
      }
    }
    return [
      new RedisValue({ values: redisValues, ttl: TimeConstants.oneWeek }),
    ];
  }
}
