import { Module } from '@nestjs/common';
import { AdminOperationsResolver } from './admin-operations.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { FlagNftService } from './flag-nft.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftsFlagsRepository } from 'src/db/nftFlags';
import { VerifyContentService } from '../assets/verify-content.service';
import { CommonModule } from 'src/common.module';
import { NftRarityModuleGraph } from '../nft-rarity/nft-rarity.module';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { AssetsRedisHandler } from '../assets/loaders/assets.redis-handler';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';

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
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([NftsFlagsRepository]),
    NftRarityModuleGraph,
  ],
  exports: [FlagNftService],
})
export class AdminOperationsModuleGraph {}
