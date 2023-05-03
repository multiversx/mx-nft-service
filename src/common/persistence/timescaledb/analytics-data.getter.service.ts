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

  async getSumCompleteValues({
    series,
    metric,
  }: AnalyticsArgs): Promise<HistoricDataModel[]> {
    const firstRow = await this.sumDaily
      .createQueryBuilder()
      .select('time')
      .where('series = :series', { series })
      .andWhere('key = :metric', { metric })
      .orderBy('time', 'ASC')
      .limit(1)
      .getRawOne();

    if (!firstRow) {
      return [];
    }

    const query = await this.sumDaily
      .createQueryBuilder()
      .select("time_bucket_gapfill('1 day', time) as day")
      .addSelect('sum(sum) as sum')
      .where('series = :series', { series })
      .andWhere('key = :metric', { metric })
      .andWhere('time between :start and now()', {
        start: firstRow.time,
      })
      .groupBy('day')
      .getRawMany();
    return (
      query?.map(
        (row) =>
          new HistoricDataModel({
            timestamp: moment.utc(row.day).format('yyyy-MM-DD HH:mm:ss'),
            value: row.sum ?? '0',
          }),
      ) ?? []
    );
  }

  async getTopCollectionsDaily({
    series,
    metric,
  }: AnalyticsArgs): Promise<HistoricDataModel[]> {
    const firstRow = await this.sumDaily
      .createQueryBuilder()
      .select('time')
      .where('series = :series', { series })
      .andWhere('key = :metric', { metric })
      .orderBy('sum', 'DESC')
      .limit(1)
      .getRawOne();

    if (!firstRow) {
      return [];
    }

    const query = await this.sumDaily
      .createQueryBuilder()
      .select("time_bucket_gapfill('1 day', time) as day")
      .addSelect('sum(sum) as sum')
      .where('series = :series', { series })
      .andWhere('key = :metric', { metric })
      .andWhere('time between :start and now()', {
        start: firstRow.time,
      })
      .groupBy('day')
      .getRawMany();
    return (
      query?.map(
        (row) =>
          new HistoricDataModel({
            timestamp: moment.utc(row.day).format('yyyy-MM-DD HH:mm:ss'),
            value: row.sum ?? '0',
          }),
      ) ?? []
    );
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
      .where('key = :metric', { metric })
      .andWhere('series = :series', { series })
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
