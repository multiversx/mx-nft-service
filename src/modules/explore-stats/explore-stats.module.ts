import { Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { ExploreStatsResolver } from './explore-stats.resolver';
import { ExploreStatsService } from './explore-stats.service';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { OffersModuleGraph } from '../offers/offers.module';

@Module({
  providers: [ExploreStatsService, ExploreStatsResolver],
  imports: [MxCommunicationModule, CollectionsModuleGraph, AuctionsModuleGraph, OffersModuleGraph],
  exports: [ExploreStatsService],
})
export class ExploreStatsModuleGraph {}
