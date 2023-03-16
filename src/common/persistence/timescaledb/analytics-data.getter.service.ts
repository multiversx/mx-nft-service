import { Injectable, Logger } from '@nestjs/common';
import moment from 'moment';
import { HistoricDataModel } from 'src/modules/analytics/models/analytics.model';
import { XNftsAnalyticsEntity } from './entities/analytics.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  computeTimeInterval,
  convertBinToTimeResolution,
} from 'src/utils/analytics.utils';
import { AnalyticsArgs } from './entities/analytics.query';

@Injectable()
export class AnalyticsDataGetterService {
  constructor(
    @InjectRepository(XNftsAnalyticsEntity, 'timescaledb')
    private readonly nftsAnalytics: Repository<XNftsAnalyticsEntity>, // @InjectRepository(SumDaily) // private readonly sumDaily: Repository<SumDaily>, // @InjectRepository(SumHourly)
  ) // private readonly sumHourly: Repository<SumHourly>,
  // @InjectRepository(CloseDaily)
  // private readonly closeDaily: Repository<CloseDaily>,
  // @InjectRepository(CloseHourly)
  // private readonly closeHourly: Repository<CloseHourly>,
  {}

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

  // async getLatestCompleteValues({
  //   series,
  //   metric,
  // }: AnalyticsArgs): Promise<HistoricDataModel[]> {
  //   const firstRow = await this.closeDaily
  //     .createQueryBuilder()
  //     .select('time')
  //     .where('series = :series', { series })
  //     .andWhere('key = :metric', { metric })
  //     .orderBy('time', 'ASC')
  //     .limit(1)
  //     .getRawOne();

  //   if (!firstRow) {
  //     return [];
  //   }

  //   const query = await this.closeDaily
  //     .createQueryBuilder()
  //     .select("time_bucket_gapfill('1 day', time) as day")
  //     .addSelect('locf(last(last, time)) as last')
  //     .where('series = :series', { series })
  //     .andWhere('key = :metric', { metric })
  //     .andWhere('time between :start and now()', {
  //       start: firstRow.time,
  //     })
  //     .groupBy('day')
  //     .getRawMany();

  //   return (
  //     query?.map(
  //       (row) =>
  //         new HistoricDataModel({
  //           timestamp: moment.utc(row.day).format('yyyy-MM-DD HH:mm:ss'),
  //           value: row.last ?? '0',
  //         }),
  //     ) ?? []
  //   );
  // }

  // async getSumCompleteValues({
  //   series,
  //   metric,
  // }: AnalyticsArgs): Promise<HistoricDataModel[]> {
  //   const firstRow = await this.sumDaily
  //     .createQueryBuilder()
  //     .select('time')
  //     .where('series = :series', { series })
  //     .andWhere('key = :metric', { metric })
  //     .orderBy('time', 'ASC')
  //     .limit(1)
  //     .getRawOne();

  //   if (!firstRow) {
  //     return [];
  //   }

  //   const query = await this.sumDaily
  //     .createQueryBuilder()
  //     .select("time_bucket_gapfill('1 day', time) as day")
  //     .addSelect('sum(sum) as sum')
  //     .where('series = :series', { series })
  //     .andWhere('key = :metric', { metric })
  //     .andWhere('time between :start and now()', {
  //       start: firstRow.time,
  //     })
  //     .groupBy('day')
  //     .getRawMany();
  //   return (
  //     query?.map(
  //       (row) =>
  //         new HistoricDataModel({
  //           timestamp: moment.utc(row.day).format('yyyy-MM-DD HH:mm:ss'),
  //           value: row.sum ?? '0',
  //         }),
  //     ) ?? []
  //   );
  // }

  // async getValues24h({
  //   series,
  //   metric,
  // }: AnalyticsArgs): Promise<HistoricDataModel[]> {
  //   const latestTimestamp = await this.closeDaily
  //     .createQueryBuilder()
  //     .select('time')
  //     .addSelect('last')
  //     .where('series = :series', { series })
  //     .andWhere('key = :metric', { metric })
  //     .orderBy('time', 'DESC')
  //     .limit(1)
  //     .getRawOne();

  //   if (!latestTimestamp) {
  //     return [];
  //   }

  //   const startDate = moment
  //     .utc(latestTimestamp.time)
  //     .isBefore(moment.utc().subtract(1, 'day'))
  //     ? moment.utc(latestTimestamp.time)
  //     : moment.utc().subtract(1, 'day');

  //   const query = await this.closeHourly
  //     .createQueryBuilder()
  //     .select("time_bucket_gapfill('1 hour', time) as hour")
  //     .addSelect('locf(last(last, time)) as last')
  //     .where('series = :series', { series })
  //     .andWhere('key = :metric', { metric })
  //     .andWhere('time between :start and now()', {
  //       start: startDate.toDate(),
  //     })
  //     .groupBy('hour')
  //     .getRawMany();

  //   const dayBefore = moment.utc().subtract(1, 'day');
  //   const results = query.filter((row) =>
  //     moment.utc(row.hour).isSameOrAfter(dayBefore),
  //   );

  //   for (const result of results) {
  //     if (result.last) {
  //       break;
  //     }
  //     result.last = latestTimestamp.last;
  //   }

  //   return (
  //     results.map(
  //       (row) =>
  //         new HistoricDataModel({
  //           timestamp: moment.utc(row.hour).format('yyyy-MM-DD HH:mm:ss'),
  //           value: row.last ?? '0',
  //         }),
  //     ) ?? []
  //   );
  // }

  // async getValues24hSum({
  //   series,
  //   metric,
  // }: AnalyticsArgs): Promise<HistoricDataModel[]> {
  //   const query = await this.sumHourly
  //     .createQueryBuilder()
  //     .select("time_bucket_gapfill('1 hour', time) as hour")
  //     .addSelect('sum(sum) as sum')
  //     .where('series = :series', { series })
  //     .andWhere('key = :metric', { metric })
  //     .andWhere("time between now() - INTERVAL '1 day' and now()")
  //     .groupBy('hour')
  //     .getRawMany();
  //   return (
  //     query?.map(
  //       (row) =>
  //         new HistoricDataModel({
  //           timestamp: moment.utc(row.hour).format('yyyy-MM-DD HH:mm:ss'),
  //           value: row.sum ?? '0',
  //         }),
  //     ) ?? []
  //   );
  // }

  async getLatestHistoricData({
    time,
    series,
    metric,
    start,
  }: AnalyticsArgs): Promise<HistoricDataModel[]> {
    const [startDate, endDate] = computeTimeInterval(time, start);
    const query = await this.nftsAnalytics
      .createQueryBuilder()
      .select('time')
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
