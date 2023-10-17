import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { AnalyticsDataGetterService } from 'src/common/persistence/timescaledb/analytics-data.getter.service';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AnalyticsArgs } from 'src/common/persistence/timescaledb/entities/analytics.query';
import { AnalyticsAggregateValue } from './models/analytics-aggregate-value';

@Injectable()
export class AnalyticsGetterService {
  constructor(
    protected readonly cacheService: CacheService,
    protected readonly logger: Logger,
    private readonly analyticsQuery: AnalyticsDataGetterService,
  ) {}

  async getVolumeDataForTimePeriod(time: string, series: string, metric: string): Promise<AnalyticsAggregateValue[]> {
    const cacheKey = this.getAnalyticsCacheKey('volumeData', time, series, metric);
    return await this.cacheService.getOrSet(
      cacheKey,
      () =>
        this.analyticsQuery.getVolumeDataWithMarketplaces({
          series,
          metric,
          time,
        }),
      Constants.oneMinute() * 2,
    );
  }

  async getFloorPriceForTimePeriod(time: string, series: string, metric: string): Promise<AnalyticsAggregateValue[]> {
    const cacheKey = this.getAnalyticsCacheKey('floorPriceData', time, series, metric);
    return await this.cacheService.getOrSet(
      cacheKey,
      () =>
        this.analyticsQuery.getFloorPriceData({
          series,
          metric,
          time,
        }),
      Constants.oneMinute() * 2,
    );
  }

  async getTopCollectionsDaily(
    { metric, series }: AnalyticsArgs,
    limit: number = 10,
    offset: number = 0,
  ): Promise<[AnalyticsAggregateValue[], number]> {
    const cacheKey = this.getAnalyticsCacheKey('getTopCollectionsDaily', metric, limit, offset, series);
    return await this.cacheService.getOrSet(
      cacheKey,
      () => this.analyticsQuery.getTopCollectionsDaily({ metric, series }, limit, offset),
      Constants.oneMinute() * 2,
    );
  }

  private getAnalyticsCacheKey(...args: any) {
    return generateCacheKeyFromParams('analytics', ...args);
  }
}
