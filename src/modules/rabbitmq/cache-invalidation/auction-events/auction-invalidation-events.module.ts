import { Module } from '@nestjs/common';
import { AuctionsCachingModule } from 'src/modules/auctions/caching/auctions-caching.module';
import { rabbitExchanges } from '../../rabbit-config';
import { CommonRabbitModule } from '../common-rabbitmq.module';
import { AuctionInvalidationEventsService } from './auction-invalidation-events.service';

@Module({
  imports: [
    AuctionsCachingModule,
    CommonRabbitModule.register(() => {
      return {
        exchange: rabbitExchanges.CACHE_INVALIDATION,
        uri: process.env.COMMON_RABBITMQ_URL,
      };
    }),
  ],
  providers: [AuctionInvalidationEventsService],
  exports: [AuctionInvalidationEventsService],
})
export class AuctionInvalidationEventsModule {}
