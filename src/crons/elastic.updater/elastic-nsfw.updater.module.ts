import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { AdminOperationsModuleGraph } from 'src/modules/admins/admin-operations.module';
import { AssetsRedisHandler } from 'src/modules/assets/loaders/assets.redis-handler';
import { ElasticNsfwUpdaterService } from './elastic-nsfw.updater.service';
import { NsfwUpdaterService } from './nsfw.updater.service';

@Module({
  imports: [CommonModule, AdminOperationsModuleGraph],
  providers: [
    ElasticNsfwUpdaterService,
    AssetsRedisHandler,
    NsfwUpdaterService,
  ],
  exports: [ElasticNsfwUpdaterService, NsfwUpdaterService],
})
export class ElasticNsfwUpdaterModule {}
