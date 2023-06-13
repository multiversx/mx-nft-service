import { MxToolsService } from 'src/common/services/mx-communication/mx-tools.service';
import { AnalyticsInput } from './models/AnalyticsInput';
import { MxElasticService } from 'src/common';
import { CachingService } from '@multiversx/sdk-nestjs';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import * as hash from 'object-hash';
import { Injectable } from '@nestjs/common';
import { AggregateValue } from './models/aggregate-value';
import { CollectionsAnalyticsModel } from './models/collections-stats.model';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { AnalyticsGetterService } from './analytics.getter.service';
import { HistoricDataModel } from './models/analytics.model';

@Injectable()
export class CollectionsAnalyticsService {
  constructor(
    private toolsService: MxToolsService,
    private elasticService: MxElasticService,
    private cacheService: CachingService,
    private persistenceService: PersistenceService,
    private readonly analyticsGetter: AnalyticsGetterService,
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

  public async getHolders(collectionIdentifier: string): Promise<number> {
    return this.cacheService.getOrSetCache(
      `${CacheInfo.NftsHolders.key}_${collectionIdentifier}`,
      () =>
        this.elasticService.getHoldersCountForCollection(collectionIdentifier),
      CacheInfo.NftsHolders.ttl,
      CacheInfo.NftsHolders.ttl / 2,
    );
  }

  public async getCollectionsOrderByVolum(
    limit: number = 10,
    offset: number = 0,
    series: string = '',
  ): Promise<[CollectionsAnalyticsModel[], number]> {
    const [collections, count] =
      await this.analyticsGetter.getTopCollectionsDaily(
        { metric: 'volumeUSD', series },
        limit,
        offset,
      );

    return [
      collections.map((c) => CollectionsAnalyticsModel.fromTimescaleModel(c)),
      count,
    ];
  }

  public async getVolumeForTimePeriod(
    time: string,
    series: string,
    metric: string,
  ): Promise<HistoricDataModel[]> {
    return await this.analyticsGetter.getVolumeDataForTimePeriod(
      time,
      series,
      metric,
    );
  }

  public async getCollectionFloorPrice(
    collectionIdentifier: string,
  ): Promise<number> {
    return this.cacheService.getOrSetCache(
      `${CacheInfo.CollectionFloorPrice.key}_${collectionIdentifier}`,
      () =>
        this.persistenceService.getCollectionFloorPrice(collectionIdentifier),
      CacheInfo.CollectionFloorPrice.ttl,
      CacheInfo.CollectionFloorPrice.ttl / 2,
    );
  }
}
