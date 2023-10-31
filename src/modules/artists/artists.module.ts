import { Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { ArtistsResolver } from './artists.resolver';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces/marketplaces-caching.service';
import { ArtistsService } from './artists.service';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';
import { CommonModule } from 'src/common.module';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';

@Module({
  providers: [ArtistsService, ArtistsResolver, MarketplacesService, MarketplacesCachingService],
  imports: [MxCommunicationModule, CollectionsModuleGraph, CommonModule, PubSubListenerModule],
  exports: [ArtistsService],
})
export class ArtistsModuleGraph {}
