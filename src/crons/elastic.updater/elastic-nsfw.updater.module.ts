import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { AdminOperationsModuleGraph } from 'src/modules/admins/admin-operations.module';
import { NftRarityModuleGraph } from 'src/modules/nft-rarity/nft-rarity.module';
import { ElasticNsfwUpdaterService } from './elastic-nsfw.updater.service';

@Module({
  imports: [CommonModule, AdminOperationsModuleGraph, NftRarityModuleGraph],
  providers: [ElasticNsfwUpdaterService],
})
export class ElasticNsfwUpdaterModule {}
