import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { AdminOperationsModuleGraph } from 'src/modules/admins/admin-operations.module';
import { AssetsRedisHandler } from 'src/modules/assets/loaders/assets.redis-handler';
import { ElasticNsfwUpdaterService } from './elastic-nsfw.updater.service';

@Module({
  imports: [CommonModule, AdminOperationsModuleGraph],
  providers: [ElasticNsfwUpdaterService, AssetsRedisHandler],
  exports: [ElasticNsfwUpdaterService],
})
export class ElasticNsfwUpdaterModule {}
