import { GeneralAnalyticsModel } from './models/general-stats.model';
import { MxToolsService } from 'src/common/services/mx-communication/mx-tools.service';
import { AnalyticsInput } from './models/AnalyticsInput';
import { MxElasticService } from 'src/common';
import { CollectionsGetterService } from '../nftCollections/collections-getter.service';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { CachingService } from '@multiversx/sdk-nestjs';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import * as hash from 'object-hash';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeneralAnalyticsService {
  constructor(
    private toolsService: MxToolsService, private elasticService: MxElasticService,
    private cacheService: CachingService,
    private collectionsService: CollectionsGetterService,
    private marketplacesService: MarketplacesService,) { }

  public async getAnalyticsFromDataApi(input: AnalyticsInput): Promise<GeneralAnalyticsModel> {
    return this.cacheService.getOrSetCache(`${CacheInfo.NftGeneralAnalytics.key}_${hash(input)}`, () => this.toolsService.getNftsStats(input), CacheInfo.NftGeneralAnalytics.ttl, CacheInfo.NftGeneralAnalytics.ttl / 2)

  }

  public async getHolders(): Promise<number> {
    return this.cacheService.getOrSetCache(CacheInfo.NftsHolders.key, () => this.elasticService.getHoldersCount(), CacheInfo.NftsHolders.ttl, CacheInfo.NftsHolders.ttl / 2)
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
