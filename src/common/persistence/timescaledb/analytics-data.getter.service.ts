import { Injectable } from '@nestjs/common';
import { XNftsAnalyticsEntity } from './entities/analytics.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { computeTimeInterval } from 'src/utils/analytics.utils';
import { AnalyticsArgs } from './entities/analytics.query';
import { FloorPriceDaily, SumDaily } from './entities/sum-daily.entity';
import { AnalyticsAggregateValue } from 'src/modules/analytics/models/analytics-aggregate-value';

@Injectable()
export class AnalyticsDataGetterService {
  constructor(
    @InjectRepository(XNftsAnalyticsEntity, 'timescaledb')
    private readonly nftsAnalytics: Repository<XNftsAnalyticsEntity>,
    @InjectRepository(SumDaily, 'timescaledb')
    private readonly sumDaily: Repository<SumDaily>,
    @InjectRepository(FloorPriceDaily, 'timescaledb')
    private readonly floorPriceDaily: Repository<FloorPriceDaily>,
  ) {}

  async getAggregatedValue({
    series,
    metric,
    time,
  }: AnalyticsArgs): Promise<string> {
    const [startDate, endDate] = computeTimeInterval(time);

    const query = await this.nftsAnalytics
      .createQueryBuilder()
      .select('sum(value)')
      .where('series = :series', { series })
      .andWhere('key = :key', { key: metric })
      .andWhere('timestamp between :start and :end', {
        start: startDate,
        end: endDate,
      })
      .getRawOne();

    return query?.sum ?? '0';
  }

  async getTopCollectionsDaily(
    { metric, series }: AnalyticsArgs,
    limit: number = 10,
    offset: number = 0,
  ): Promise<[AnalyticsAggregateValue[], number]> {
    const query = this.sumDaily
      .createQueryBuilder()
      .select('sum(sum) as sum')
      .addSelect('series')
      .addSelect('time')
      .andWhere('key = :metric', { metric })
      .andWhere(`time between now() - INTERVAL '1 day' and now()`)
      .orderBy('sum', 'DESC')
      .groupBy('series, sum, time');
    if (series) {
      query.andWhere('series = :series', { series });
    }
    const [response, count] = await Promise.all([
      query.offset(offset).limit(limit).getRawMany(),
      query.getCount(),
    ]);
    if (series && count === 0) {
      return [[new AnalyticsAggregateValue({ value: 0, series: series })], 1];
    }

    return [
      response?.map((row) => AnalyticsAggregateValue.fromDataApi(row)) ?? [],
      count ?? 0,
    ];
  }

  async getVolumeData({
    time,
    series,
    metric,
    start,
  }: AnalyticsArgs): Promise<AnalyticsAggregateValue[]> {
    const [startDate, endDate] = computeTimeInterval(time, start);
    const query = await this.sumDaily
      .createQueryBuilder()
      .select("time_bucket_gapfill('1 day', time) as timestamp")
      .addSelect('sum(sum) as sum')
      .where('key = :metric', { metric })
      .andWhere('series = :series', { series })
      .andWhere(
        endDate ? 'time BETWEEN :startDate AND :endDate' : 'time >= :startDate',
        { startDate, endDate },
      )
      .orderBy('timestamp', 'ASC')
      .groupBy('timestamp')
      .getRawMany();

    return query?.map((row) => AnalyticsAggregateValue.fromDataApi(row)) ?? [];
  }

  async getFloorPriceData({
    time,
    series,
    metric,
    start,
  }: AnalyticsArgs): Promise<AnalyticsAggregateValue[]> {
    const [startDate, endDate] = computeTimeInterval(time, start);
    const query = await this.floorPriceDaily
      .createQueryBuilder()
      .select("time_bucket_gapfill('1 day', time) as timestamp")
      .addSelect('locf(min(min)) as sum')
      .where('key = :metric', { metric })
      .andWhere('series = :series', { series })
      .andWhere(
        endDate ? 'time BETWEEN :startDate AND :endDate' : 'time >= :startDate',
        { startDate, endDate },
      )
      .orderBy('timestamp', 'ASC')
      .groupBy('timestamp')
      .getRawMany();

    return query?.map((row) => AnalyticsAggregateValue.fromDataApi(row)) ?? [];
  }
}
