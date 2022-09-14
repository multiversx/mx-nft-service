import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { AccountsStatsResolver } from './accounts-stats.resolver';
import { AccountsStatsService } from './accounts-stats.service';
import { AccountsStatsCachingService } from './accounts-stats.caching.service';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces/marketplaces-caching.service';

@Module({
  providers: [
    AccountsStatsService,
    AccountsStatsCachingService,
    AccountsStatsResolver,
    MarketplacesService,
    MarketplacesCachingService,
  ],
  imports: [ElrondCommunicationModule],
  exports: [AccountsStatsService],
})
export class AccountsStatsModuleGraph {}
