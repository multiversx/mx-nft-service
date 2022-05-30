import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { CollectionsStatsResolver } from './collections-stats.resolver';
import { CollectionsStatsService } from './collections-stats.service';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';

@Module({
  providers: [
    CollectionsStatsService,
    CollectionsStatsResolver,
    AccountStatsRepository,
  ],
  imports: [ElrondCommunicationModule],
  exports: [CollectionsStatsService],
})
export class CollectionsStatsModuleGraph {}
