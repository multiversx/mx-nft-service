import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { AssetsRedisHandler } from 'src/modules/assets';
import { CollectionAssetsCountRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets.redis-handler';
import { AuctionInvalidationEventsModule } from './auction-events/auction-invalidation-events.module';
import { ChangedEventsConsumer } from './change-events.consumer';
import { CommonRabbitModule } from './common-rabbitmq.module';

@Module({
  imports: [
    CommonModule,
    AuctionInvalidationEventsModule,
    CommonRabbitModule.register(() => {
      return {
        exchange: 'cache-events',
        uri: process.env.COMMON_RABBITMQ_URL,
      };
    }),
    forwardRef(() => ElrondCommunicationModule),
  ],
  providers: [
    ChangedEventsConsumer,
    AssetsRedisHandler,
    CollectionAssetsCountRedisHandler,
    CollectionAssetsRedisHandler,
  ],
  exports: [],
})
export class ChangeEventsModule {}
