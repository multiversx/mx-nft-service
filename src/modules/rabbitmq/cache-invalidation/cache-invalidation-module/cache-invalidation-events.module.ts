import { Module } from '@nestjs/common';
import { AssetsHistoryCachingService } from 'src/modules/asset-history/assets-history-caching.service';
import { AssetsLikesCachingService } from 'src/modules/assets/assets-likes.caching.service';
import { IsAssetLikedRedisHandler } from 'src/modules/assets/loaders/asset-is-liked.redis-handler';
import { AuctionsCachingModule } from 'src/modules/auctions/caching/auctions-caching.module';
import { BlacklistedCollectionsCachingService } from 'src/modules/blacklist/blacklisted-collections.caching.service';
import { FeaturedCollectionsCachingService } from 'src/modules/featured/featured-caching.service';
import { NotificationsCachingService } from 'src/modules/notifications/notifications-caching.service';
import { OffersCachingModule } from 'src/modules/offers/caching/offers-caching.module';
import { OrdersCachingModule } from 'src/modules/orders/caching/orders-caching.module';
import { CacheInvalidationEventsService } from './cache-invalidation-events.service';

@Module({
  imports: [AuctionsCachingModule, OrdersCachingModule, OffersCachingModule],
  providers: [
    CacheInvalidationEventsService,
    NotificationsCachingService,
    AssetsLikesCachingService,
    IsAssetLikedRedisHandler,
    AssetsHistoryCachingService,
    FeaturedCollectionsCachingService,
    BlacklistedCollectionsCachingService,
  ],
  exports: [CacheInvalidationEventsService, NotificationsCachingService],
})
export class CacheInvalidationEventsModule {}
