import { forwardRef, Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { AccountsStatsResolver } from './accounts-stats.resolver';
import { AccountsStatsService } from './accounts-stats.service';
import { AccountsStatsCachingService } from './accounts-stats.caching.service';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';
import { OffersModuleGraph } from '../offers/offers.module';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { MarketplacesModuleGraph } from '../marketplaces/marketplaces.module';

@Module({
  providers: [Logger, AccountsStatsService, AccountsStatsCachingService, AccountsStatsResolver],
  imports: [
    MxCommunicationModule,
    forwardRef(() => CollectionsModuleGraph),
    forwardRef(() => OffersModuleGraph),
    PubSubListenerModule,
    MarketplacesModuleGraph,
  ],
  exports: [AccountsStatsService],
})
export class AccountsStatsModuleGraph {}
