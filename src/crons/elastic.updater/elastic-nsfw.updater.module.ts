import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { AdminOperationsModuleGraph } from 'src/modules/admins/admin-operations.module';
import { CacheEventsPublisherModule } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { ElasticNsfwUpdaterService } from './elastic-nsfw.updater.service';
import { NsfwUpdaterService } from './nsfw.updater.service';

@Module({
  imports: [
    CommonModule,
    AdminOperationsModuleGraph,
    CacheEventsPublisherModule,
  ],
  providers: [ElasticNsfwUpdaterService, NsfwUpdaterService],
  exports: [ElasticNsfwUpdaterService, NsfwUpdaterService],
})
export class ElasticNsfwUpdaterModule {}
