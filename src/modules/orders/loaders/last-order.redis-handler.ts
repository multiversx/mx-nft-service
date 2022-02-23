import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisDataloaderHandler } from 'src/modules/assets/redis-dataloader.handler';

@Injectable()
export class LastOrderRedisHandler extends RedisDataloaderHandler<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'auction_active_orders');
  }

  mapValues(auctionIds: number[], ordersAuctionsIds: { [key: string]: any[] }) {
    return auctionIds?.map((auctionId) =>
      ordersAuctionsIds[auctionId] ? ordersAuctionsIds[auctionId] : [],
    );
  }
}
