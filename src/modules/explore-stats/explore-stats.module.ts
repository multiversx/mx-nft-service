import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { ExploreStatsResolver } from './explore-stats.resolver';
import { ExploreStatsService } from './explore-stats.service';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';

@Module({
  providers: [ExploreStatsService, ExploreStatsResolver],
  imports: [ElrondCommunicationModule, CollectionsModuleGraph],
  exports: [ExploreStatsService],
})
export class ExploreStatsModuleGraph {}
