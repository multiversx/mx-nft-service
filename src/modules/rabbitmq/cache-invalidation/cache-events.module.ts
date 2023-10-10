import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { AssetsRedisHandler } from 'src/modules/assets';
import { CollectionAssetsCountRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets.redis-handler';
import { rabbitExchanges } from './../rabbit-config';
import { CacheInvalidationEventsModule } from './cache-invalidation-module/cache-invalidation-events.module';
import { CacheEventsConsumer } from './cache-events.consumer';
import { CommonRabbitModule } from './common-rabbitmq.module';
import { CacheAdminEventsModule } from './cache-admin-module/cache-admin.module';
import { AssetScamInfoRedisHandler } from 'src/modules/assets/loaders/assets-scam-info.redis-handler';
import { AssetsCollectionsRedisHandler } from 'src/modules/assets/loaders/assets-collection.redis-handler';
import { AssetsCollectionsForOwnerRedisHandler } from 'src/modules/assets/loaders/assets-collection-for-owner.redis-handler';
import { MintersCachingService } from 'src/modules/minters/minters-caching.service';
import { MarketplacesCachingService } from 'src/modules/marketplaces/marketplaces-caching.service';
import { CampaignsCachingService } from 'src/modules/campaigns/campaigns-caching.service';
import { MarketplaceRedisHandler } from 'src/modules/marketplaces/loaders/marketplace.redis-handler';

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
    forwardRef(() => MxCommunicationModule),
  ],
  providers: [
    CacheEventsConsumer,
    AssetsRedisHandler,
    CollectionAssetsCountRedisHandler,
    CollectionAssetsRedisHandler,
    AssetScamInfoRedisHandler,
    AssetsCollectionsRedisHandler,
    AssetsCollectionsForOwnerRedisHandler,
    MintersCachingService,
    MarketplacesCachingService,
    MarketplaceRedisHandler,
    CampaignsCachingService,
  ],
  exports: [],
})
export class CacheEventsModule {}
