import { MxToolsService } from 'src/common/services/mx-communication/mx-tools.service';
import { AnalyticsInput } from './models/analytics-input.model';
import { MxElasticService } from 'src/common';
import { CollectionsGetterService } from '../nftCollections/collections-getter.service';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { CachingService } from '@multiversx/sdk-nestjs';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import * as hash from 'object-hash';
import { Injectable } from '@nestjs/common';
import { AggregateValue } from './models/aggregate-value';

@Injectable()
export class GeneralAnalyticsService {
  constructor(
    private toolsService: MxToolsService,
    private elasticService: MxElasticService,
    private cacheService: CachingService,
    private collectionsService: CollectionsGetterService,
    private marketplacesService: MarketplacesService,
  ) {}

  public async getNftsCount(input: AnalyticsInput): Promise<AggregateValue[]> {
    return this.cacheService.getOrSetCache(
      `${CacheInfo.NftAnalyticsCount.key}_${hash(input)}`,
      () => this.toolsService.getNftsCount(input),
      CacheInfo.NftAnalyticsCount.ttl,
      CacheInfo.NftAnalyticsCount.ttl / 2,
    );
  }

  public async getLast24HActive(
    input: AnalyticsInput,
  ): Promise<AggregateValue[]> {
    return this.cacheService.getOrSetCache(
      `${CacheInfo.NftAnalytic24hCount.key}_${hash(input)}`,
      () => this.toolsService.getLast24HActive(input),
      CacheInfo.NftAnalytic24hCount.ttl,
      CacheInfo.NftAnalytic24hCount.ttl / 2,
    );
  }
  public async getActiveNftsStats(
    input: AnalyticsInput,
  ): Promise<AggregateValue[]> {
    return this.cacheService.getOrSetCache(
      `${CacheInfo.NftAnalytic24hListing.key}_${hash(input)}`,
      () => this.toolsService.getActiveNftsStats(input),
      CacheInfo.NftAnalytic24hListing.ttl,
      CacheInfo.NftAnalytic24hListing.ttl / 2,
    );
  }

  public async getHolders(): Promise<number> {
    return this.cacheService.getOrSetCache(
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
