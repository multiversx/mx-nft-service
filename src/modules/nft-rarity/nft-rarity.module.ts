import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { RarityUpdaterService } from 'src/crons/elastic.updater/rarity.updater.service';
import { NftRarityRepository } from 'src/db/nft-rarity/nft-rarity.repository';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityService } from './nft-rarity.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NftRarityRepository]),
    CollectionsModuleGraph,
    ElrondCommunicationModule,
    CommonModule,
  ],
  providers: [
    NftRarityService,
    NftRarityComputeService,
    AssetRarityInfoRedisHandler,
    RarityUpdaterService,
  ],
  exports: [
    NftRarityService,
    RarityUpdaterService,
    TypeOrmModule.forFeature([NftRarityRepository]),
  ],
})
export class NftRarityModuleGraph {}
