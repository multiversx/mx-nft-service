import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { CachingService, Constants } from '@multiversx/sdk-nestjs';
import { AnalyticsDataGetterService } from 'src/common/persistence/timescaledb/analytics-data.getter.service';
import { HistoricDataModel } from './models/analytics.model';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AnalyticsArgs } from 'src/common/persistence/timescaledb/entities/analytics.query';

@Injectable()
export class AnalyticsGetterService {
  constructor(
    protected readonly cachingService: CachingService,
    protected readonly logger: Logger,
    private readonly analyticsQuery: AnalyticsDataGetterService,
  ) {}

  async getLatestCompleteValues(
    series: string,
    metric: string,
    start?: string,
    time?: string,
  ): Promise<HistoricDataModel[]> {
    const cacheKey = this.getAnalyticsCacheKey(
      'latestCompleteValues',
      series,
      metric,
    );
    let data = await this.cachingService.getCache<HistoricDataModel[]>(
      cacheKey,
    );
    if (start) {
      const formattedStart = moment.unix(parseInt(start)).utc();

      data = data.filter((historicData) =>
        moment.utc(historicData.timestamp).isSameOrAfter(formattedStart),
      );

      if (time) {
        const [timeAmount, timeUnit] = time.match(/[a-zA-Z]+|[0-9]+/g);
        const endDate = formattedStart.add(
          moment.duration(timeAmount, timeUnit as moment.unitOfTime.Base),
        );
        data = data.filter((historicData) =>
          moment.utc(historicData.timestamp).isSameOrBefore(endDate),
        );
      }
    }

    return data;
  }

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
  ): Promise<[HistoricDataModel[], number]> {
    const cacheKey = this.getAnalyticsCacheKey('values24h', series, metric);
    return await this.cachingService.getOrSetCache(
      cacheKey,
      () =>
        this.analyticsQuery.getTopCollectionsDaily({
          metric,
        }),
      Constants.oneMinute() * 2,
    );
  }

  async getVolumeDataForTimePeriod(
    time: string,
    series: string,
    metric: string,
  ): Promise<HistoricDataModel[]> {
    const cacheKey = this.getAnalyticsCacheKey(
      'latestHistoricData',
      time,
      series,
      metric,
    );
    return await this.cachingService.getOrSetCache(
      cacheKey,
      () =>
        this.analyticsQuery.getVolumeData({
          table: 'hyper_nfts_analytics',
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
  ): Promise<[HistoricDataModel[], number]> {
    const cacheKey = this.getAnalyticsCacheKey(
      'getTopCollectionsDaily',
      metric,
      limit,
      offset,
      series,
    );
    if (series !== '') {
      return await this.cachingService.getOrSetCache(
        cacheKey,
        () =>
          this.analyticsQuery.getTopCollectionsDaily(
            { metric, series },
            limit,
            offset,
          ),
        Constants.oneMinute() * 2,
      );
    }
    return await this.cachingService.getOrSetCache(
      cacheKey,
      () =>
        this.analyticsQuery.getTopCollectionsDaily({ metric }, limit, offset),
      Constants.oneMinute() * 2,
    );
  }

  async getLatestBinnedHistoricData(
    time: string,
    series: string,
    metric: string,
  ): Promise<HistoricDataModel[]> {
    const cacheKey = this.getAnalyticsCacheKey(
      'latestBinnedHistoricData',
      time,
      series,
      metric,
    );
    return await this.cachingService.getOrSetCache(
      cacheKey,
      () =>
        this.analyticsQuery.getLatestBinnedHistoricData({
          table: 'hyper_nfts_analytics',
          series,
          metric,
          time,
        }),
      Constants.oneMinute() * 2,
    );
  }

  private getAnalyticsCacheKey(...args: any) {
    return generateCacheKeyFromParams('analytics', ...args);
  }
}
