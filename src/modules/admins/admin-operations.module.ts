import { Module } from '@nestjs/common';
import { AdminOperationsResolver } from './admin-operations.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { FlagNftService } from './flag-nft.service';
import { VerifyContentService } from '../assets/verify-content.service';
import { CommonModule } from 'src/common.module';
import { NftRarityModuleGraph } from '../nft-rarity/nft-rarity.module';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { AssetsRedisHandler } from '../assets/loaders/assets.redis-handler';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { NftTraitsModule } from '../nft-traits/nft-traits.module';
import { NftScamModule } from '../nft-scam/nft-scam.module';

@Module({
  providers: [
    AdminOperationsResolver,
    FlagNftService,
    VerifyContentService,
    AssetsRedisHandler,
    AssetByIdentifierService,
    NsfwUpdaterService,
  ],
  imports: [
    CommonModule,
    CacheEventsPublisherModule,
    ElrondCommunicationModule,
    NftRarityModuleGraph,
    NftTraitsModule,
    NftScamModule,
  ],
  exports: [FlagNftService],
})
export class AdminOperationsModuleGraph {}
