import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Query } from '@nestjs/graphql';
import { Args, Resolver } from '@nestjs/graphql';
import { HistoricDataModel } from 'src/modules/analytics/models/analytics.model';
import { AnalyticsArgs } from './models/AnalyticsArgs';
import { AnalyticsGetterService } from './analytics.getter.service';

@Resolver()
export class StatsResolver {
  constructor(private readonly analyticsGetter: AnalyticsGetterService) { }

  @Query(() => [HistoricDataModel])
  async values24hSum(
    @Args('input', { type: () => AnalyticsArgs }) input: AnalyticsArgs,
  ): Promise<HistoricDataModel[]> {
    return await this.analyticsGetter.getValues24hSum(
      input.series,
      input.metric,
    );
  }

  @Query(() => [HistoricDataModel])
  async collectionStats(
    @Args('input', { type: () => AnalyticsArgs }) input: AnalyticsArgs,
  ): Promise<HistoricDataModel[]> {
    return await this.analyticsGetter.getValues24hSum(
      input.series,
      input.metric,
    );
  }

  @Query(() => [HistoricDataModel])
  async latestHistoricData(
    @Args('input', { type: () => AnalyticsArgs }) input: AnalyticsArgs,
  ): Promise<HistoricDataModel[]> {
    return this.analyticsGetter.getLatestHistoricData(
      input.time,
      input.series,
      input.metric,
      input.start,
    );
  }

  @Query(() => [HistoricDataModel])
  async topCollectionsDaily(
    @Args('input', { type: () => AnalyticsArgs }) input: AnalyticsArgs,
  ): Promise<HistoricDataModel[]> {
    return this.analyticsGetter.getLatestHistoricData(
      input.time,
      input.series,
      input.metric,
      input.start,
    );
  }

  @Query(() => [HistoricDataModel])
  async latestBinnedHistoricData(
    @Args('input', { type: () => AnalyticsArgs }) input: AnalyticsArgs,
  ): Promise<HistoricDataModel[]> {
    return this.analyticsGetter.getLatestBinnedHistoricData(
      input.time,
      input.series,
      input.metric,
      input.bin,
      input.start,
    );
  }
}
