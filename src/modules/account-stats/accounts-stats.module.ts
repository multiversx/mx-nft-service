import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { AccountsStatsResolver } from './accounts-stats.resolver';
import { AccountsStatsService } from './accounts-stats.service';
import { AccountsStatsCachingService } from './accounts-stats.caching.service';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces/marketplaces-caching.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceRepository } from 'src/db/marketplaces/marketplaces.repository';
import { MarketplaceCollectionsRepository } from 'src/db/marketplaces/marketplace-collections.repository';

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
    TypeOrmModule.forFeature([MarketplaceRepository]),
    TypeOrmModule.forFeature([MarketplaceCollectionsRepository]),
  ],
  exports: [AccountsStatsService],
})
export class AccountsStatsModuleGraph {}
