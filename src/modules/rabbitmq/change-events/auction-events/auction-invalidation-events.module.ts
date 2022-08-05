import { forwardRef, Module } from '@nestjs/common';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { AssetAvailableTokensCountRedisHandler } from 'src/modules/assets/loaders/asset-available-tokens-count.redis-handler';
import { AuctionsModuleGraph } from 'src/modules/auctions/auctions.module';
import { OrdersModuleGraph } from 'src/modules/orders/orders.module';
import { CommonRabbitModule } from '../common-rabbitmq.module';
import { AuctionInvalidationEventsService } from './auction-invalidation-events.service';

@Module({
  imports: [
    AuctionsModuleGraph,
    OrdersModuleGraph,
    forwardRef(() => AuctionsModuleDb),
    CommonRabbitModule.register(() => {
      return {
        exchange: 'cache-events',
        uri: process.env.COMMON_RABBITMQ_URL,
      };
    }),
  ],
  providers: [
    AuctionInvalidationEventsService,
    AssetAvailableTokensCountRedisHandler,
  ],
  exports: [AuctionInvalidationEventsService],
})
export class AuctionInvalidationEventsModule {}
