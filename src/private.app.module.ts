import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common.module';
import { CachingController } from './common/services/caching/caching.controller';
import { NsfwUpdaterService } from './crons/elastic.updater/nsfw.updater.service';
import { RarityUpdaterService } from './crons/elastic.updater/rarity.updater.service';
import { AdminOperationsModuleGraph } from './modules/admins/admin-operations.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReindexController } from './modules/ingress/reindex.controller';
import { MarketplacesModuleGraph } from './modules/marketplaces/marketplaces.module';
import { MetricsController } from './modules/metrics/metrics.controller';
import { NftRarityModuleGraph } from './modules/nft-rarity/nft-rarity.module';
import { ScamModule } from './modules/scam/scam.module';
import { NftTraitsModule } from './modules/nft-traits/nft-traits.module';
import * as ormconfig from './ormconfig';
import { ScamUpdateConsumerModule } from './modules/rabbitmq/elastic-updates/scam-trigger/scam-update-consumer.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    AdminOperationsModuleGraph,
    NftRarityModuleGraph,
    ScamUpdateConsumerModule,
    ScamModule,
    NftTraitsModule,
    MarketplacesModuleGraph,
    AuthModule,
  ],
  providers: [Logger, NsfwUpdaterService, RarityUpdaterService],
  controllers: [MetricsController, ReindexController, CachingController],
  exports: [NsfwUpdaterService, RarityUpdaterService],
})
export class PrivateAppModule { }
