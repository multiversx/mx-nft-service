import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common.module';
import { AdminOperationsModuleGraph } from 'src/modules/admins/admin-operations.module';
import { CacheEventsPublisherModule } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { ElasticNsfwUpdaterService } from './elastic-nsfw.updater.service';
import { NsfwUpdaterService } from './nsfw.updater.service';
import * as ormconfig from './../../ormconfig';
import { DynamicModuleUtils } from 'src/utils/dynamicModule-utils';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    AdminOperationsModuleGraph,
    CacheEventsPublisherModule,
    DynamicModuleUtils.getCachingModule(),
  ],
  providers: [Logger, ElasticNsfwUpdaterService, NsfwUpdaterService],
  exports: [ElasticNsfwUpdaterService, NsfwUpdaterService],
})
export class ElasticNsfwUpdaterModule {}
