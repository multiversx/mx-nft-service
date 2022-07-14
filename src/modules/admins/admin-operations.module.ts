import { Module } from '@nestjs/common';
import { AdminOperationsResolver } from './admin-operations.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { FlagNftService } from './flag-nft.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftsFlagsRepository } from 'src/db/nftFlags';
import { VerifyContentService } from '../assets/verify-content.service';
import { CommonModule } from 'src/common.module';
import { NftRarityModuleGraph } from '../nft-rarity/nft-rarity.module';
import { AssetsRedisHandler } from '../assets';
import { AssetsModuleGraph } from '../assets/assets.module';

@Module({
  providers: [
    AdminOperationsResolver,
    FlagNftService,
    VerifyContentService,
    NftRarityModuleGraph,
    AssetsRedisHandler,
  ],
  imports: [
    CommonModule,
    ElrondCommunicationModule,
    AssetsModuleGraph,
    TypeOrmModule.forFeature([NftsFlagsRepository]),
    CommonModule,
    NftRarityModuleGraph,
  ],
  exports: [FlagNftService, AssetsRedisHandler],
})
export class AdminOperationsModuleGraph {}
