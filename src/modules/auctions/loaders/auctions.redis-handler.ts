import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { AuctionEntity } from 'src/db/auctions';
import { RedisDataloaderHandler } from '../../assets/redis-dataloader.handler';

@Injectable()
export class AuctionsRedisHandler extends RedisDataloaderHandler<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'auction');
  }

  mapValues(
    auctionsIds: number[],
    auctionsIdentifiers: { [key: string]: AuctionEntity[] },
  ) {
    return auctionsIds?.map((auctionId) =>
      auctionsIdentifiers[auctionId] ? auctionsIdentifiers[auctionId] : [],
    );
  }
}
