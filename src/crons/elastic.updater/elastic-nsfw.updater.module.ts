import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { AdminOperationsModuleGraph } from 'src/modules/admins/admin-operations.module';
import { ElasticNsfwUpdaterService } from './elastic-nsfw.updater.service';

@Module({
  imports: [CommonModule, AdminOperationsModuleGraph],
  providers: [ElasticNsfwUpdaterService],
})
export class ElasticNsfwUpdaterModule {}
