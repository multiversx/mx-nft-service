import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplacesService } from './marketplaces.service';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { MarketplacesResolver } from './marketplaces.resolver';
import { MarketplaceRepository } from 'src/db/marketplaces/marketplaces.repository';
import { MarketplacesCachingService } from './marketplaces-caching.service';

@Module({
  providers: [
    MarketplacesResolver,
    MarketplacesService,
    MarketplacesCachingService,
  ],
  imports: [
    PubSubListenerModule,
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([MarketplaceRepository]),
  ],
  exports: [MarketplacesService],
})
export class MarketplacesModuleGraph {}
