import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { ArtistsResolver } from './artists.resolver';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces/marketplaces-caching.service';
import { ArtistsService } from './artists.service';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';

@Module({
  providers: [
    ArtistsService,
    ArtistsResolver,
    MarketplacesService,
    MarketplacesCachingService,
  ],
  imports: [ElrondCommunicationModule, CollectionsModuleGraph],
  exports: [ArtistsService],
})
export class ArtistsModuleGraph {}
