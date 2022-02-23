import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { OrderEntity } from 'src/db/orders';
import { RedisDataloaderHandler } from '../../assets/redis-dataloader.handler';

@Injectable()
export class AuctionsOrdersRedisHandler extends RedisDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'auction_orders');
  }

  mapValues(
    auctionIds: string[],
    ordersAuctionsIds: { [key: string]: OrderEntity[] },
  ) {
    return auctionIds?.map((id) =>
      ordersAuctionsIds[id] ? ordersAuctionsIds[id] : [],
    );
  }
}
