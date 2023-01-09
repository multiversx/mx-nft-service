import { Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { CollectionsStatsResolver } from './collections-stats.resolver';
import { CollectionsStatsService } from './collections-stats.service';

@Module({
  providers: [Logger, CollectionsStatsService, CollectionsStatsResolver],
  imports: [MxCommunicationModule],
  exports: [CollectionsStatsService],
})
export class CollectionsStatsModuleGraph {}
