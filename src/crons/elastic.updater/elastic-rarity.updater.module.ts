import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { NftRarityModule } from 'src/modules/nft-rarity/nft-rarity.module';
import { ElasticRarityUpdaterService } from './elastic-rarity.updater.service';

@Module({
  imports: [CommonModule, NftRarityModule],
  providers: [ElasticRarityUpdaterService],
})
export class ElasticRarityUpdaterModule {}
