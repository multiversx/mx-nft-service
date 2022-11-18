import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common.module';
import { NsfwUpdaterService } from './crons/elastic.updater/nsfw.updater.service';
import { RarityUpdaterService } from './crons/elastic.updater/rarity.updater.service';
import { AdminOperationsModuleGraph } from './modules/admins/admin-operations.module';
import { ReindexController } from './modules/ingress/reindex.controller';
import { MetricsController } from './modules/metrics/metrics.controller';
import { NftRarityModuleGraph } from './modules/nft-rarity/nft-rarity.module';
import { NftScamModule } from './modules/nft-scam/nft-scam.module';
import { NftTraitsModule } from './modules/nft-traits/nft-traits.module';
import { CacheEventsPublisherModule } from './modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import * as ormconfig from './ormconfig';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    AdminOperationsModuleGraph,
    NftRarityModuleGraph,
    CacheEventsPublisherModule,
    NftScamModule,
    NftTraitsModule,
  ],
  providers: [Logger, NsfwUpdaterService, RarityUpdaterService],
  controllers: [MetricsController, ReindexController],
  exports: [NsfwUpdaterService, RarityUpdaterService],
})
export class PrivateAppModule {}
