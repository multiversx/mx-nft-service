import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { AccountsStatsResolver } from './accounts-stats.resolver';
import { AccountsStatsService } from './accounts-stats.service';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';

@Module({
  providers: [
    AccountsStatsService,
    AccountsStatsResolver,
    AccountStatsRepository,
  ],
  imports: [ElrondCommunicationModule],
  exports: [AccountsStatsService],
})
export class AccountsStatsModuleGraph {}
