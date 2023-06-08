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
    { metric }: AnalyticsArgs,
    limit: number = 10,
    offset: number = 0,
  ): Promise<[HistoricDataModel[], number]> {
    const query = this.sumDaily
      .createQueryBuilder()
      .select('sum(sum) as sum')
      .addSelect('series')
      .addSelect('time')
      .andWhere('key = :metric', { metric })
      .andWhere(`time between now() - INTERVAL '1 day' and now()`)
      .orderBy('sum', 'DESC')
      .groupBy('series, sum, time');
    const [response, count] = await Promise.all([
      query.offset(offset).limit(limit).getRawMany(),
      query.getCount(),
    ]);

    return [
      response?.map(
        (row) =>
          new HistoricDataModel({
            timestamp: moment.utc(row.time).format('yyyy-MM-DD HH:mm:ss'),
            value: row.sum ?? '0',
            series: row.series,
          }),
      ) ?? [],
      count ?? 0,
    ];
  }

  async getLatestHistoricData({
    time,
    series,
    metric,
    start,
  }: AnalyticsArgs): Promise<HistoricDataModel[]> {
    const [startDate, endDate] = computeTimeInterval(time, start);
    const query = await this.nftsAnalytics
      .createQueryBuilder()
      .select('timestamp')
      .addSelect('value')
      .addSelect('series')
      .where('key = :metric', { metric })
      .andWhere(
        endDate
          ? 'timestamp BETWEEN :startDate AND :endDate'
          : 'timestamp >= :startDate',
        { startDate, endDate },
      )
      .orderBy('timestamp', 'ASC')
      .getRawMany();

    return (
      query?.map(
        (row) =>
          new HistoricDataModel({
            timestamp: moment.utc(row.timestamp).format('yyyy-MM-DD HH:mm:ss'),
            value: row.value,
            series: row.series,
          }),
      ) ?? []
    );
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
