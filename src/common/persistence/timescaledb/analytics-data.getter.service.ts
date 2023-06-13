import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { HistoricDataModel } from 'src/modules/analytics/models/analytics.model';
import { XNftsAnalyticsEntity } from './entities/analytics.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  computeTimeInterval,
  convertBinToTimeResolution,
} from 'src/utils/analytics.utils';
import { AnalyticsArgs } from './entities/analytics.query';
import { SumDaily } from './entities/sum-daily.entity';
import { AggregateValue } from 'src/modules/analytics/models/aggregate-value';

@Injectable()
export class AnalyticsDataGetterService {
  constructor(
    @InjectRepository(XNftsAnalyticsEntity, 'timescaledb')
    private readonly nftsAnalytics: Repository<XNftsAnalyticsEntity>,
    @InjectRepository(SumDaily, 'timescaledb')
    private readonly sumDaily: Repository<SumDaily>,
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
  ): Promise<[AggregateValue[], number]> {
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

    return [
      response?.map((row) => AggregateValue.fromDataApi(row)) ?? [],
      count ?? 0,
    ];
  }

  async getVolumeData({
    time,
    series,
    metric,
    start,
  }: AnalyticsArgs): Promise<AggregateValue[]> {
    const [startDate, endDate] = computeTimeInterval(time, start);
    const query = await this.sumDaily
      .createQueryBuilder()
      .select("time_bucket_gapfill('1 day', time) as timestamp")
      .addSelect('sum(sum) as sum')
      .addSelect('max(sum) as max')
      .addSelect('min(sum) as min')
      .where('key = :metric', { metric })
      .andWhere('series = :series', { series })
      .andWhere(
        endDate ? 'time BETWEEN :startDate AND :endDate' : 'time >= :startDate',
        { startDate, endDate },
      )
      .orderBy('timestamp', 'ASC')
      .groupBy('timestamp')
      .getRawMany();

    return query?.map((row) => AggregateValue.fromDataApi(row)) ?? [];
  }

  async getLatestBinnedHistoricData({
    time,
    series,
    metric,
    start,
    bin,
  }: AnalyticsArgs): Promise<HistoricDataModel[]> {
    const [startDate, endDate] = computeTimeInterval(time, start);
    const timeResolution = convertBinToTimeResolution(bin);

    const query = await this.nftsAnalytics
      .createQueryBuilder()
      .select(`time_bucket(${timeResolution}, timestamp) as time`)
      .addSelect('avg(value) as avg')
      .where('series = :series', { series })
      .andWhere('key = :metric', { metric })
      .andWhere('timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawMany();

    return (
      query?.map(
        (row) =>
          new HistoricDataModel({
            timestamp: moment.utc(row.time).format('yyyy-MM-DD HH:mm:ss'),
            value: row.avg,
          }),
      ) ?? []
    );
  }
}
