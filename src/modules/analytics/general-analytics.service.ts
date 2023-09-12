import { MxToolsService } from 'src/common/services/mx-communication/mx-tools.service';
import { AnalyticsInput } from './models/analytics-input.model';
import { MxElasticService } from 'src/common';
import { CollectionsGetterService } from '../nftCollections/collections-getter.service';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import * as hash from 'object-hash';
import { Injectable } from '@nestjs/common';
import { AnalyticsAggregateValue } from './models/analytics-aggregate-value';

@Injectable()
export class GeneralAnalyticsService {
  constructor(
    private toolsService: MxToolsService,
    private elasticService: MxElasticService,
    private cacheService: CacheService,
    private collectionsService: CollectionsGetterService,
    private marketplacesService: MarketplacesService,
  ) {}

  public async getNftsCount(input: AnalyticsInput): Promise<AnalyticsAggregateValue[]> {
    return this.cacheService.getOrSet(
      `${CacheInfo.NftAnalyticsCount.key}_${hash(input)}`,
      () => this.toolsService.getNftsCount(input),
      CacheInfo.NftAnalyticsCount.ttl,
      CacheInfo.NftAnalyticsCount.ttl / 2,
    );
  }

  public async getLast24HActive(input: AnalyticsInput): Promise<AnalyticsAggregateValue[]> {
    return this.cacheService.getOrSet(
      `${CacheInfo.NftAnalytic24hCount.key}_${hash(input)}`,
      () => this.toolsService.getLast24HActive(input),
      CacheInfo.NftAnalytic24hCount.ttl,
      CacheInfo.NftAnalytic24hCount.ttl / 2,
    );
  }
  public async getActiveNftsStats(input: AnalyticsInput): Promise<AnalyticsAggregateValue[]> {
    return this.cacheService.getOrSet(
      `${CacheInfo.NftAnalytic24hListing.key}_${hash(input)}`,
      () => this.toolsService.getActiveNftsStats(input),
      CacheInfo.NftAnalytic24hListing.ttl,
      CacheInfo.NftAnalytic24hListing.ttl / 2,
    );
  }

  public async getHolders(): Promise<number> {
    return this.cacheService.getOrSet(
      CacheInfo.NftsHolders.key,
      () => this.elasticService.getHoldersCount(),
      CacheInfo.NftsHolders.ttl,
      CacheInfo.NftsHolders.ttl / 2,
    );
  }

  public async getCollections(): Promise<number> {
    const [, collections] = await this.collectionsService.getCollections();
    return collections;
  }

  public async getMarketplaces(): Promise<number> {
    const marketplaces = await this.marketplacesService.getMarketplaces();
    return marketplaces?.count;
  }
}
