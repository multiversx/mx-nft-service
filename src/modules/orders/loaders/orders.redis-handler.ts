import { RedisCacheService } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { LocalRedisCacheService } from 'src/common';
import { OrderEntity } from 'src/db/orders/order.entity';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class OrdersRedisHandler extends RedisKeyValueDataloaderHandler<number> {
  constructor(
    redisCacheService: RedisCacheService,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    super(redisCacheService, 'auction_orders', localRedisCacheService);
  }

  mapValues(
    returnValues: { key: number; value: any }[],
    ordersAuctionsIds: { [key: string]: OrderEntity[] },
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
