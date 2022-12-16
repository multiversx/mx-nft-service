import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { AssetsRedisHandler } from 'src/modules/assets';
import { CollectionAssetsCountRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets.redis-handler';
import { rabbitExchanges } from './../rabbit-config';
import { CacheInvalidationEventsModule } from './cache-invalidation-module/cache-invalidation-events.module';
import { CacheEventsConsumer } from './cache-events.consumer';
import { CommonRabbitModule } from './common-rabbitmq.module';
import { CacheAdminEventsModule } from './cache-admin-module/cache-admin.module';

@Module({
  imports: [
    CommonModule,
    CacheInvalidationEventsModule,
    CacheAdminEventsModule,
    CommonRabbitModule.register(() => {
      return {
        exchange: rabbitExchanges.CACHE_INVALIDATION,
        uri: process.env.COMMON_RABBITMQ_URL,
      };
    }),
    forwardRef(() => ElrondCommunicationModule),
  ],
  providers: [
    CacheEventsConsumer,
    AssetsRedisHandler,
    CollectionAssetsCountRedisHandler,
    CollectionAssetsRedisHandler,
  ],
  exports: [],
})
export class CacheEventsModule {}
