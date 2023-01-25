import { Logger, Module } from '@nestjs/common';
import { AdminOperationsResolver } from './admin-operations.resolver';
import { MxCommunicationModule } from 'src/common';
import { FlagNftService } from './flag-nft.service';
import { VerifyContentService } from '../assets/verify-content.service';
import { CommonModule } from 'src/common.module';
import { NftRarityModuleGraph } from '../nft-rarity/nft-rarity.module';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { AssetsRedisHandler } from '../assets/loaders/assets.redis-handler';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { NftTraitsModule } from '../nft-traits/nft-traits.module';
import { MarketplacesModuleGraph } from '../marketplaces/marketplaces.module';
import { AuthModule } from '../auth/auth.module';
import { ReportNftsModuleGraph } from '../report-nfts/reports-nft.module';

@Module({
  imports: [
    CommonModule,
    CacheEventsPublisherModule,
    MxCommunicationModule,
    NftRarityModuleGraph,
    NftTraitsModule,
    MarketplacesModuleGraph,
    AuthModule,
    ReportNftsModuleGraph,
  ],
  providers: [
    Logger,
    AdminOperationsResolver,
    FlagNftService,
    VerifyContentService,
    AssetsRedisHandler,
    AssetByIdentifierService,
    NsfwUpdaterService,
  ],
  exports: [FlagNftService],
})
export class AdminOperationsModuleGraph {}
