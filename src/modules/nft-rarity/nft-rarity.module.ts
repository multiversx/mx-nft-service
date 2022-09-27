import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { RarityUpdaterService } from 'src/crons/elastic.updater/rarity.updater.service';
import { CollectionsModuleGraph } from 'src/modules/nftCollections/collections.module';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityService } from './nft-rarity.service';

@Module({
  imports: [CollectionsModuleGraph, ElrondCommunicationModule, CommonModule],
  providers: [
    NftRarityService,
    NftRarityComputeService,
    AssetRarityInfoRedisHandler,
    RarityUpdaterService,
  ],
  exports: [NftRarityService, RarityUpdaterService],
})
export class NftRarityModuleGraph {}
