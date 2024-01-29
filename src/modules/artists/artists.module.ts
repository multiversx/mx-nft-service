import { Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { ArtistsResolver } from './artists.resolver';
import { ArtistsService } from './artists.service';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';
import { CommonModule } from 'src/common.module';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { MarketplacesModuleGraph } from '../marketplaces/marketplaces.module';

@Module({
  providers: [ArtistsService, ArtistsResolver],
  imports: [MxCommunicationModule, CollectionsModuleGraph, CommonModule, PubSubListenerModule, MarketplacesModuleGraph],
  exports: [ArtistsService],
})
export class ArtistsModuleGraph {}
