import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { RarityUpdaterService } from 'src/crons/elastic.updater/rarity.updater.service';
import { CollectionModuleGraph } from 'src/modules/nftCollections/collection.module';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityService } from './nft-rarity.service';

@Module({
  imports: [CollectionModuleGraph, ElrondCommunicationModule, CommonModule],
  providers: [
    NftRarityService,
    NftRarityComputeService,
    AssetRarityInfoRedisHandler,
    RarityUpdaterService,
  ],
  exports: [NftRarityService, RarityUpdaterService],
})
export class NftRarityModuleGraph {}
