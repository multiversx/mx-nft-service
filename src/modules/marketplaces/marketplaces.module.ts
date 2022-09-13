import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplacesService } from './marketplaces.service';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { MarketplacesResolver } from './marketplaces.resolver';
import { MarketplaceRepository } from 'src/db/marketplaces/marketplaces.repository';
import { MarketplacesCachingService } from './marketplaces-caching.service';
import { MarketplaceCollectionsRepository } from 'src/db/marketplaces/marketplace-collections.repository';
import { NftMarketplaceAbiService } from '../auctions';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { CommonModule } from 'src/common.module';
import { MarketplaceProvider } from './loaders/marketplace.loader';
import { MarketplaceRedisHandler } from './loaders/marketplace.redis-handler';

@Module({
  providers: [
    MarketplacesResolver,
    MarketplacesService,
    MarketplacesCachingService,
    NftMarketplaceAbiService,
    MarketplaceProvider,
    MarketplaceRedisHandler,
  ],
  imports: [
    PubSubListenerModule,
    ElrondCommunicationModule,
    forwardRef(() => CommonModule),
    forwardRef(() => AuctionsModuleGraph),
    TypeOrmModule.forFeature([MarketplaceRepository]),
    TypeOrmModule.forFeature([MarketplaceCollectionsRepository]),
  ],
  exports: [
    MarketplacesService,
    TypeOrmModule.forFeature([MarketplaceRepository]),
  ],
})
export class MarketplacesModuleGraph {}
