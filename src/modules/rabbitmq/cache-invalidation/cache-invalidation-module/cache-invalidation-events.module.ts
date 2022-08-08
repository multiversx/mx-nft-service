import { Module } from '@nestjs/common';
import { AuctionsCachingModule } from 'src/modules/auctions/caching/auctions-caching.module';
import { OrdersCachingModule } from 'src/modules/orders/caching/orders-caching.module';
import { CacheInvalidationEventsService } from './cache-invalidation-events.service';

@Module({
  imports: [AuctionsCachingModule, OrdersCachingModule],
  providers: [CacheInvalidationEventsService],
  exports: [CacheInvalidationEventsService],
})
export class CacheInvalidationEventsModule {}
