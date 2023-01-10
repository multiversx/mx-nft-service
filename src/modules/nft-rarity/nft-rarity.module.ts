import { Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { RarityUpdaterService } from 'src/crons/elastic.updater/rarity.updater.service';
import { CollectionsModuleGraph } from 'src/modules/nftCollections/collections.module';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';
import { JaccardDistancesRarityService } from './algorithms/jaccard-distances.service';
import { OpenRarityService } from './algorithms/open-rarity.service';
import { TraitAndStatisticalRarityService } from './algorithms/trait-and-statistical-rarity.service';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityElasticService } from './nft-rarity.elastic.service';
import { NftRarityService } from './nft-rarity.service';

@Module({
  imports: [CollectionsModuleGraph, MxCommunicationModule, CommonModule],
  providers: [
    Logger,
    NftRarityService,
    NftRarityElasticService,
    NftRarityComputeService,
    JaccardDistancesRarityService,
    TraitAndStatisticalRarityService,
    OpenRarityService,
    AssetRarityInfoRedisHandler,
    RarityUpdaterService,
  ],
  exports: [
    NftRarityService,
    NftRarityElasticService,
    NftRarityComputeService,
    JaccardDistancesRarityService,
    TraitAndStatisticalRarityService,
    OpenRarityService,
    RarityUpdaterService,
  ],
})
export class NftRarityModuleGraph {}
