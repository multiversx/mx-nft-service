import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { CachingModule } from 'src/common/services/caching/caching.module';
import { NftRarityModuleGraph } from 'src/modules/nft-rarity/nft-rarity.module';
import { ElasticRarityUpdaterService } from './elastic-rarity.updater.service';

@Module({
  imports: [CommonModule, NftRarityModuleGraph, CachingModule],
  providers: [ElasticRarityUpdaterService],
  exports: [ElasticRarityUpdaterService],
})
export class ElasticRarityUpdaterModule {}
