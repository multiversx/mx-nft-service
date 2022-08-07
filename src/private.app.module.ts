import { Module } from '@nestjs/common';
import { CommonModule } from './common.module';
import { NsfwUpdaterService } from './crons/elastic.updater/nsfw.updater.service';
import { RarityUpdaterService } from './crons/elastic.updater/rarity.updater.service';
import { AdminOperationsModuleGraph } from './modules/admins/admin-operations.module';
import { ReindexController } from './modules/ingress/reindex.controller';
import { MetricsController } from './modules/metrics/metrics.controller';
import { NftRarityModuleGraph } from './modules/nft-rarity/nft-rarity.module';
import { CacheEventsPublisherModule } from './modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';

@Module({
  providers: [NsfwUpdaterService, RarityUpdaterService],
  exports: [NsfwUpdaterService, RarityUpdaterService],
  imports: [
    CommonModule,
    AdminOperationsModuleGraph,
    NftRarityModuleGraph,
    CacheEventsPublisherModule,
  ],
  controllers: [MetricsController, ReindexController],
})
export class PrivateAppModule {}
