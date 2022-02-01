import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisDataloaderHandler } from 'src/modules/assets/redis-dataloader.handler';
import { OrderEntity } from '.';

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
