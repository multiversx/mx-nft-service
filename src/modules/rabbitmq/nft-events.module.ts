import { forwardRef, Logger, Module } from '@nestjs/common';
import { NftEventsService } from './nft-events.service';
import { NftEventsConsumer } from './nft-events.consumer';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { OrdersModuleGraph } from '../orders/orders.module';
import { RevertEventsConsumer } from './revert-events.consumer';
import { RevertEventsService } from './revert.events.service';
import { AssetAvailableTokensCountRedisHandler } from '../assets/loaders/asset-available-tokens-count.redis-handler';
import { AvailableTokensForAuctionRedisHandler } from '../auctions/loaders/available-tokens-auctions.redis-handler';
import { CollectionAssetsCountRedisHandler } from '../nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from '../nftCollections/loaders/collection-assets.redis-handler';
import { AssetsRedisHandler } from '../assets';
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
import { ElasticRarityUpdaterService } from 'src/crons/elastic.updater/elastic-rarity.updater.service';
import { NotificationsModuleGraph } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => CommonModule),
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
    AvailableTokensForAuctionRedisHandler,
    AssetAvailableTokensCountRedisHandler,
    AssetsRedisHandler,
    CollectionAssetsCountRedisHandler,
    CollectionAssetsRedisHandler,
    AssetRarityInfoRedisHandler,
    VerifyContentService,
    NftRarityService,
    NftRarityComputeService,
    FlagNftService,
    ElasticRarityUpdaterService,
  ],
  exports: [NftEventsService],
})
export class NftEventsModule {}
