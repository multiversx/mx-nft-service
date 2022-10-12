import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { AccountsStatsResolver } from './accounts-stats.resolver';
import { AccountsStatsService } from './accounts-stats.service';
import { AccountsStatsCachingService } from './accounts-stats.caching.service';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces/marketplaces-caching.service';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';

@Module({
  providers: [
    AccountsStatsService,
    AccountsStatsCachingService,
    AccountsStatsResolver,
    MarketplacesService,
    MarketplacesCachingService,
  ],
  imports: [
    ElrondCommunicationModule,
    forwardRef(() => CollectionsModuleGraph),
  ],
  exports: [AccountsStatsService],
})
export class AccountsStatsModuleGraph {}
