import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { CollectionsStatsResolver } from './collections-stats.resolver';
import { CollectionsStatsService } from './collections-stats.service';
import { CollectionStatsRepository } from 'src/db/collection-stats/collection-stats.repository';

@Module({
  providers: [
    CollectionsStatsService,
    CollectionsStatsResolver,
    CollectionStatsRepository,
  ],
  imports: [ElrondCommunicationModule],
  exports: [CollectionsStatsService],
})
export class CollectionsStatsModuleGraph {}
