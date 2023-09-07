import { Injectable } from '@nestjs/common';
import { AssetsLikesCachingService } from 'src/modules/assets/assets-likes.caching.service';
import { AssetAvailableTokensCountRedisHandler } from 'src/modules/assets/loaders/asset-available-tokens-count.redis-handler';
import { AuctionsCachingService } from 'src/modules/auctions/caching/auctions-caching.service';
import { BlacklistedCollectionsCachingService } from 'src/modules/blacklist/blacklisted-collections.caching.service';
import { FeaturedCollectionsCachingService } from 'src/modules/featured/featured-caching.service';
import { NotificationsCachingService } from 'src/modules/notifications/notifications-caching.service';
import { OffersCachingService } from 'src/modules/offers/caching/offers-caching.service';
import { OrdersCachingService } from 'src/modules/orders/caching/orders-caching.service';
import { ChangedEvent } from '../events/changed.event';

@Injectable()
export class CacheInvalidationEventsService {
  constructor(
    private auctionsCachingService: AuctionsCachingService,
    private ordersCachingService: OrdersCachingService,
    private notificationsCachingService: NotificationsCachingService,
    private availableTokensCount: AssetAvailableTokensCountRedisHandler,
    private assetsLikesCachingService: AssetsLikesCachingService,
    private featuredCollectionsCachingService: FeaturedCollectionsCachingService,
    private blacklistedCollectionsCachingService: BlacklistedCollectionsCachingService,
    // private analyticsService: TrendingCollectionsWarmerService,
    private offersCachingService: OffersCachingService,
  ) {}

  async invalidateAuction(payload: ChangedEvent) {
    await Promise.all([
      await this.auctionsCachingService.invalidatePersistentCaching(payload.id, payload.address, payload.extraInfo?.marketplaceKey),
      await this.availableTokensCount.clearKey(payload.id),
    ]);
  }

  async invalidateOrder(payload: ChangedEvent) {
    await this.ordersCachingService.invalidateCache(parseInt(payload.id), payload.address, payload.extraInfo?.marketplaceKey);
  }

  async invalidateNotifications(payload: ChangedEvent) {
    this.notificationsCachingService.clearMultipleCache(payload.id, payload.extraInfo?.marketplaceKey);
  }

  async invalidateOneNotification(payload: ChangedEvent) {
    this.notificationsCachingService.invalidateCache(payload.id, payload.extraInfo?.marketplaceKey);
  }

  async invalidateAssetLike(payload: ChangedEvent) {
    this.assetsLikesCachingService.invalidateCache(payload.id, payload.address);
  }

  async invalidateFeaturedCollectionsCache(): Promise<void> {
    await this.featuredCollectionsCachingService.invalidateFeaturedCollectionsCache();
  }

  async invalidateBlacklistedCollectionsCache(): Promise<void> {
    await this.blacklistedCollectionsCachingService.invalidateBlacklistedCollectionsCache();
  }

  async invalidateOffers(payload: ChangedEvent) {
    this.offersCachingService.invalidateCache(payload.id, payload.address);
  }

  // async invalidateTrendingAuctions(payload: ChangedEvent) {
  //   await this.analyticsService.handleTrendingCollections(payload.id);
  // }
}
