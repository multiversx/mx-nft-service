import { Module } from '@nestjs/common';
import { AssetsHistoryCachingService } from 'src/modules/asset-history/assets-history-caching.service';
import { AssetsLikesCachingService } from 'src/modules/assets/assets-likes.caching.service';
import { IsAssetLikedRedisHandler } from 'src/modules/assets/loaders/asset-is-liked.redis-handler';
import { AuctionsCachingModule } from 'src/modules/auctions/caching/auctions-caching.module';
import { FeaturedModuleGraph } from 'src/modules/featured/featured.module';
import { NotificationsCachingService } from 'src/modules/notifications/notifications-caching.service';
import { OrdersCachingModule } from 'src/modules/orders/caching/orders-caching.module';
import { CacheInvalidationEventsService } from './cache-invalidation-events.service';

@Module({
  imports: [AuctionsCachingModule, OrdersCachingModule, FeaturedModuleGraph],
  providers: [
    CacheInvalidationEventsService,
    NotificationsCachingService,
    AssetsLikesCachingService,
    IsAssetLikedRedisHandler,
    AssetsHistoryCachingService,
  ],
  exports: [CacheInvalidationEventsService, NotificationsCachingService],
})
export class CacheInvalidationEventsModule {}
