import { Module } from '@nestjs/common';
import { CommonModule } from './common.module';
import { ElasticNsfwUpdaterModule } from './crons/elastic.updater/elastic-nsfw.updater.module';
import { ElasticRarityUpdaterModule } from './crons/elastic.updater/elastic-rarity.updater.module';
import { ReindexController } from './modules/ingress/reindex.controller';
import { MetricsController } from './modules/metrics/metrics.controller';

@Module({
  imports: [CommonModule, ElasticNsfwUpdaterModule, ElasticRarityUpdaterModule],
  controllers: [MetricsController, ReindexController],
})
export class PrivateAppModule {}
