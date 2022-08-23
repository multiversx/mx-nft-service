import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common.module';
import { NsfwUpdaterService } from './crons/elastic.updater/nsfw.updater.service';
import { RarityUpdaterService } from './crons/elastic.updater/rarity.updater.service';
import { AdminOperationsModuleGraph } from './modules/admins/admin-operations.module';
import { AuctionsModuleGraph } from './modules/auctions/auctions.module';
import { XoxnoReindexService } from './modules/auctions/xoxno-reindex.service';
import { ReindexController } from './modules/ingress/reindex.controller';
import { MetricsController } from './modules/metrics/metrics.controller';
import { NftRarityModuleGraph } from './modules/nft-rarity/nft-rarity.module';
import { CacheEventsPublisherModule } from './modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import * as ormconfig from './ormconfig';

@Module({
  providers: [NsfwUpdaterService, RarityUpdaterService, XoxnoReindexService],
  exports: [NsfwUpdaterService, RarityUpdaterService, XoxnoReindexService],
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    AdminOperationsModuleGraph,
    NftRarityModuleGraph,
    CacheEventsPublisherModule,
    AuctionsModuleGraph,
  ],
  controllers: [MetricsController, ReindexController],
})
export class PrivateAppModule {}
