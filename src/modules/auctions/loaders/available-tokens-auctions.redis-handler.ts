import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisDataloaderHandler } from 'src/modules/common/redis-dataloader.handler';

@Injectable()
export class AvailableTokensForAuctionRedisHandler extends RedisDataloaderHandler<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'auction_available_tokens');
  }

  mapValues(auctionIds: number[], auctionsIds: { [key: string]: any[] }) {
    return auctionIds?.map((auctionId) =>
      auctionsIds[auctionId]
        ? auctionsIds[auctionId]
        : [
            {
              auctionId: auctionId,
              availableTokens: 0,
            },
          ],
    );
  }
}
