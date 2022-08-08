import { Module } from '@nestjs/common';
import { AuctionsCachingModule } from 'src/modules/auctions/caching/auctions-caching.module';
import { OrdersCachingModule } from 'src/modules/orders/caching/orders-caching.module';
import { AuctionInvalidationEventsService } from './auction-invalidation-events.service';

@Module({
  imports: [AuctionsCachingModule, OrdersCachingModule],
  providers: [AuctionInvalidationEventsService],
  exports: [AuctionInvalidationEventsService],
})
export class AuctionInvalidationEventsModule {}
