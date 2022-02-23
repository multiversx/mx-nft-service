import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { OrderEntity } from 'src/db/orders';
import { RedisDataloaderHandler } from 'src/modules/common/redis-dataloader.handler';

@Injectable()
export class OrdersRedisHandler extends RedisDataloaderHandler<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'auction_orders');
  }

  mapValues(
    auctionIds: number[],
    ordersAuctionsIds: { [key: string]: OrderEntity[] },
  ) {
    return auctionIds?.map((id) =>
      ordersAuctionsIds[id] ? ordersAuctionsIds[id] : [],
    );
  }
}
