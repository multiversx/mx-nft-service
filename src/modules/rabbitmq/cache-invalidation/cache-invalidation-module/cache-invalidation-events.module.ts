import { Module } from '@nestjs/common';
import { AssetsLikesCachingService } from 'src/modules/assets/assets-likes.caching.service';
import { IsAssetLikedRedisHandler } from 'src/modules/assets/loaders/asset-is-liked.redis-handler';
import { AuctionsCachingModule } from 'src/modules/auctions/caching/auctions-caching.module';
import { NotificationsCachingService } from 'src/modules/notifications/notifications-caching.service';
import { OrdersCachingModule } from 'src/modules/orders/caching/orders-caching.module';
import { CacheInvalidationEventsService } from './cache-invalidation-events.service';

@Module({
  imports: [AuctionsCachingModule, OrdersCachingModule],
  providers: [
    CacheInvalidationEventsService,
    NotificationsCachingService,
    AssetsLikesCachingService,
    IsAssetLikedRedisHandler,
  ],
  exports: [CacheInvalidationEventsService, NotificationsCachingService],
})
export class CacheInvalidationEventsModule {}
