import { forwardRef, Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { AccountsStatsResolver } from './accounts-stats.resolver';
import { AccountsStatsService } from './accounts-stats.service';
import { AccountsStatsCachingService } from './accounts-stats.caching.service';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces/marketplaces-caching.service';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';
import { OffersModuleGraph } from '../offers/offers.module';

@Module({
  providers: [
    Logger,
    AccountsStatsService,
    AccountsStatsCachingService,
    AccountsStatsResolver,
    MarketplacesService,
    MarketplacesCachingService,
  ],
  imports: [MxCommunicationModule, forwardRef(() => CollectionsModuleGraph), forwardRef(() => OffersModuleGraph)],
  exports: [AccountsStatsService],
})
export class AccountsStatsModuleGraph {}
