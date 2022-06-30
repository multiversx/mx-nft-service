import { forwardRef, Module } from '@nestjs/common';
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
import { ElasticUpdatesEventsService } from './elasitic-updates-events.service';
import { VerifyContentService } from '../assets/verify-content.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftsFlagsRepository } from 'src/db/nftFlags/nft-flags.repository';
import { NftRarityService } from '../nft-rarity/nft-rarity.service';
import { NftRarityRepository } from 'src/db/nft-rarity/nft-rarity.repository';
import { NftRarityComputeService } from '../nft-rarity/nft-rarity.compute.service';

@Module({
  imports: [
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => CampaignsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
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
    VerifyContentService,
    NftRarityService,
    NftRarityComputeService,
  ],
  exports: [NftEventsService],
})
export class NftEventsModule {}
