import { Injectable } from '@nestjs/common';
import { AssetAvailableTokensCountRedisHandler } from 'src/modules/assets/loaders/asset-available-tokens-count.redis-handler';
import { AuctionsCachingService } from 'src/modules/auctions/caching/auctions-caching.service';
import { BidChangeEvent, ChangedEvent } from '../events/owner-changed.event';

@Injectable()
export class AuctionInvalidationEventsService {
  constructor(
    private auctionCachingService: AuctionsCachingService,
    private availableTokensCount: AssetAvailableTokensCountRedisHandler,
  ) {}

  async invalidateBidCaching(payload: BidChangeEvent) {
    this.auctionCachingService.invalidateCache();
    await this.auctionCachingService.invalidateCacheByPattern(
      payload.ownerAddress,
    );
    this.auctionCachingService.invalidatePersistentCaching(
      payload.identifier,
      payload.ownerAddress,
    );
    // await this.ordersService.invalidateCache(
    //   parseInt(payload.id),
    //   payload.ownerAddress,
    // );
    await this.availableTokensCount.clearKey(payload.identifier);
  }

  async invalidateAuction(payload: ChangedEvent) {
    this.auctionCachingService.invalidateCache();
    await this.auctionCachingService.invalidateCacheByPattern(
      payload.ownerAddress,
    );
    await this.availableTokensCount.clearKey(payload.id);
  }

  async invalidateOrder(payload: BidChangeEvent) {
    // await this.ordersService.invalidateCache(
    //   parseInt(payload.id),
    //   payload.ownerAddress,
    // );
  }
}
