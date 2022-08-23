import { forwardRef, Module } from '@nestjs/common';
import { NftEventsService } from './nft-events.service';
import { NftEventsConsumer } from './nft-events.consumer';
import { RevertEventsConsumer } from './revert-events.consumer';
import { RevertEventsService } from './revert.events.service';
import { ElrondCommunicationModule } from 'src/common';
import { MinterEventsService } from './minter-events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftsFlagsRepository } from 'src/db/nftFlags/nft-flags.repository';
import { NftRarityRepository } from 'src/db/nft-rarity/nft-rarity.repository';
import { CommonModule } from 'src/common.module';
import { CachingModule } from 'src/common/services/caching/caching.module';
import { RarityUpdaterService } from 'src/crons/elastic.updater/rarity.updater.service';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';
import { FlagNftService } from 'src/modules/admins/flag-nft.service';
import { AssetByIdentifierService } from 'src/modules/assets';
import { AssetRarityInfoRedisHandler } from 'src/modules/assets/loaders/assets-rarity-info.redis-handler';
import { VerifyContentService } from 'src/modules/assets/verify-content.service';
import { AuctionsModuleGraph } from 'src/modules/auctions/auctions.module';
import { CampaignsModuleGraph } from 'src/modules/campaigns/campaigns.module';
import { NftRarityComputeService } from 'src/modules/nft-rarity/nft-rarity.compute.service';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { NotificationsModuleGraph } from 'src/modules/notifications/notifications.module';
import { OrdersModuleGraph } from 'src/modules/orders/orders.module';
import { CacheEventsPublisherModule } from '../cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { ElasiticUpdatesConsumer } from '../elastic-updates/elastic-updates-events.consumer';
import { ElasticUpdatesEventsService } from '../elastic-updates/elastic-updates-events.service';
import { MarketplacesModuleGraph } from 'src/modules/marketplaces/marketplaces.module';
import { ExternalMarketplaceEventsService } from './external-marketplaces-events.service';

@Module({
  imports: [
    CommonModule,
    CacheEventsPublisherModule,
    forwardRef(() => CachingModule),
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => CampaignsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
    forwardRef(() => NotificationsModuleGraph),
    forwardRef(() => MarketplacesModuleGraph),
    forwardRef(() => ElrondCommunicationModule),
    TypeOrmModule.forFeature([NftsFlagsRepository]),
    TypeOrmModule.forFeature([NftRarityRepository]),
  ],
  providers: [
    NftEventsConsumer,
    NftEventsService,
    ExternalMarketplaceEventsService,
    MinterEventsService,
    RevertEventsConsumer,
    RevertEventsService,
    ElasiticUpdatesConsumer,
    ElasticUpdatesEventsService,
    AssetRarityInfoRedisHandler,
    VerifyContentService,
    NftRarityService,
    NftRarityComputeService,
    FlagNftService,
    RarityUpdaterService,
    AssetByIdentifierService,
    NsfwUpdaterService,
  ],
  exports: [NftEventsService],
})
export class NftEventsModule {}
