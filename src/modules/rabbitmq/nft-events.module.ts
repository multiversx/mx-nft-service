import { forwardRef, Module } from '@nestjs/common';
import { NftEventsService } from './nft-events.service';
import { NftEventsConsumer } from './nft-events.consumer';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { OrdersModuleGraph } from '../orders/orders.module';
import { RevertEventsConsumer } from './revert-events.consumer';
import { RevertEventsService } from './revert.events.service';
import { ElrondCommunicationModule } from 'src/common';
import { CampaignsModuleGraph } from '../campaigns/campaigns.module';
import { MinterEventsService } from './minter-events.service';
import { ElasiticUpdatesConsumer } from './elastic-updates-events.consumer';
import { VerifyContentService } from '../assets/verify-content.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftsFlagsRepository } from 'src/db/nftFlags/nft-flags.repository';
import { NftRarityService } from '../nft-rarity/nft-rarity.service';
import { NftRarityRepository } from 'src/db/nft-rarity/nft-rarity.repository';
import { NftRarityComputeService } from '../nft-rarity/nft-rarity.compute.service';
import { FlagNftService } from '../admins/flag-nft.service';
import { ElasticUpdatesEventsService } from './elastic-updates-events.service';
import { CommonModule } from 'src/common.module';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';
import { CachingModule } from 'src/common/services/caching/caching.module';
import { NotificationsModuleGraph } from '../notifications/notifications.module';
import { RarityUpdaterService } from 'src/crons/elastic.updater/rarity.updater.service';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';
import { CacheEventsPublisherModule } from './cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';

@Module({
  imports: [
    CommonModule,
    CacheEventsPublisherModule,
    forwardRef(() => CachingModule),
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => CampaignsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
    forwardRef(() => NotificationsModuleGraph),
    forwardRef(() => ElrondCommunicationModule),
    TypeOrmModule.forFeature([NftsFlagsRepository]),
    TypeOrmModule.forFeature([NftRarityRepository]),
  ],
  providers: [
    NftEventsConsumer,
    NftEventsService,
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
