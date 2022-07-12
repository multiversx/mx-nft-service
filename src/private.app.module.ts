import { Module } from '@nestjs/common';
import { CommonModule } from './common.module';
import { NsfwUpdaterService } from './crons/elastic.updater/nsfw.updater.service';
import { RarityUpdaterService } from './crons/elastic.updater/rarity.updater.service';
import { AdminOperationsModuleGraph } from './modules/admins/admin-operations.module';
import { AssetsRedisHandler } from './modules/assets';
import { ReindexController } from './modules/ingress/reindex.controller';
import { MetricsController } from './modules/metrics/metrics.controller';
import { NftRarityModuleGraph } from './modules/nft-rarity/nft-rarity.module';

@Module({
  providers: [NsfwUpdaterService, AssetsRedisHandler, RarityUpdaterService],
  exports: [NsfwUpdaterService, RarityUpdaterService],
  imports: [CommonModule, AdminOperationsModuleGraph, NftRarityModuleGraph],
  controllers: [MetricsController, ReindexController],
})
export class PrivateAppModule {}
