import { Injectable, Logger } from '@nestjs/common';
import { CachingService, Constants } from '@multiversx/sdk-nestjs';
import { AnalyticsDataGetterService } from 'src/common/persistence/timescaledb/analytics-data.getter.service';
import { HistoricDataModel } from './models/analytics.model';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { MxApiService } from 'src/common';

@Injectable()
export class AnalyticsGetterService {
  constructor(
    protected readonly cachingService: CachingService,
    protected readonly logger: Logger,
    protected readonly mxApiService: MxApiService,
    protected readonly analyticsQuery: AnalyticsDataGetterService,
  ) { }

  // async getCollectionsCount(
  // ): Promise<number> {
  //   return await this.cachingService.getOrSetCache<number>(
  //     CacheInfo.CollectionsCount.key, () => this.mxApiService.getCollectionsCount(), CacheInfo.CollectionsCount.ttl, CacheInfo.CollectionsCount.ttl / 2);
  // }

  // async getNftsNumber(
  // ): Promise<number> {
  //   return await this.cachingService.getOrSetCache<number>(
  //     CacheInfo.CollectionsCount.key, () => this.mxApiService.getNftsCount(), CacheInfo.CollectionsCount.ttl, CacheInfo.CollectionsCount.ttl / 2);
  // }

  async getValues24hSum(
    series: string,
    metric: string,
  ): Promise<HistoricDataModel[]> {
    const cacheKey = this.getAnalyticsCacheKey('values24hSum', series, metric);
    return await this.cachingService.getCache(cacheKey);
  }

  async getValues24h(
    series: string,
    metric: string,
  ): Promise<HistoricDataModel[]> {
    const cacheKey = this.getAnalyticsCacheKey('values24h', series, metric);
    return await this.cachingService.getCache(cacheKey);
  }

  async getLatestHistoricData(
    time: string,
    series: string,
    metric: string,
    start: string,
  ): Promise<HistoricDataModel[]> {
    const cacheKey = this.getAnalyticsCacheKey(
      'latestHistoricData',
      time,
      series,
      metric,
      start,
    );
    return await this.cachingService.getOrSetCache(
      cacheKey,
      () =>
        this.analyticsQuery.getLatestHistoricData({
          table: 'hyper_nfts_analytics',
          series,
          metric,
          time,
          start,
        }),
      Constants.oneMinute() * 2,
    );
  }

  async getTopCollectionsDaily(
    time: string,
    series: string,
    metric: string,
    start: string,
  ): Promise<HistoricDataModel[]> {
    const cacheKey = this.getAnalyticsCacheKey(
      'getTopCollectionsDaily',
      time,
      series,
      metric,
      start,
    );
    return await this.cachingService.getOrSetCache(
      cacheKey,
      () =>
        this.analyticsQuery.getTopCollectionsDaily({
          table: 'hyper_nfts_analytics',
          series,
          metric,
          time,
          start,
        }),
      Constants.oneMinute() * 2,
    );
  }

  async getLatestBinnedHistoricData(
    time: string,
    series: string,
    metric: string,
    bin: string,
    start: string,
  ): Promise<HistoricDataModel[]> {
    const cacheKey = this.getAnalyticsCacheKey(
      'latestBinnedHistoricData',
      time,
      series,
      metric,
      bin,
      start,
    );
    return await this.cachingService.getOrSetCache(
      cacheKey,
      () =>
        this.analyticsQuery.getLatestBinnedHistoricData({
          table: 'hyper_nfts_analytics',
          series,
          metric,
          time,
          start,
          bin,
        }),
      Constants.oneMinute() * 2,
    );
  }

  private getAnalyticsCacheKey(...args: any) {
    return generateCacheKeyFromParams('analytics', ...args);
  }
}
