import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { SearchResolver } from './search.resolver';
import { SearchService } from './search.service';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';

@Module({
  providers: [SearchService, SearchResolver, AccountStatsRepository],
  imports: [ElrondCommunicationModule],
  exports: [SearchService],
})
export class SearchModuleGraph {}
