import { Injectable } from '@nestjs/common';
import { AssetAvailableTokensCountRedisHandler } from 'src/modules/assets/loaders/asset-available-tokens-count.redis-handler';
import { AuctionsCachingService } from 'src/modules/auctions/caching/auctions-caching.service';
import { OrdersCachingService } from 'src/modules/orders/caching/orders-caching.service';
import { BidChangeEvent, ChangedEvent } from '../events/owner-changed.event';

@Injectable()
export class CacheInvalidationEventsService {
  constructor(
    private auctionsCachingService: AuctionsCachingService,
    private ordersCachingService: OrdersCachingService,
    private availableTokensCount: AssetAvailableTokensCountRedisHandler,
  ) {}

  async invalidateAuction(payload: ChangedEvent) {
    await this.auctionsCachingService.invalidateCache();
    this.auctionsCachingService.invalidatePersistentCaching;
    await this.auctionsCachingService.invalidateCacheByPattern(
      payload.ownerAddress,
    );
    await this.availableTokensCount.clearKey(payload.id);
  }

  async invalidateOrder(payload: ChangedEvent) {
    await this.ordersCachingService.invalidateCache(
      parseInt(payload.id),
      payload.ownerAddress,
    );
  }
}
