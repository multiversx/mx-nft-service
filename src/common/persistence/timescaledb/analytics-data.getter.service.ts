import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { computeTimeInterval } from 'src/utils/analytics.utils';
import { AnalyticsArgs } from './entities/analytics.query';
import { FloorPriceDaily, SumDaily, SumMarketplaceDaily } from './entities/sum-daily.entity';
import { AnalyticsAggregateValue } from 'src/modules/analytics/models/analytics-aggregate-value';

@Injectable()
export class AnalyticsDataGetterService {
  constructor(
    @InjectRepository(SumDaily, 'timescaledb')
    private readonly sumDaily: Repository<SumDaily>,
    @InjectRepository(SumMarketplaceDaily, 'timescaledb')
    private readonly sumMarketplaceDaily: Repository<SumMarketplaceDaily>,
    @InjectRepository(FloorPriceDaily, 'timescaledb')
    private readonly floorPriceDaily: Repository<FloorPriceDaily>,
  ) {}

  async getTopCollectionsDaily(
    { metric, series }: AnalyticsArgs,
    limit: number = 10,
    offset: number = 0,
  ): Promise<[AnalyticsAggregateValue[], number]> {
    const query = this.sumDaily
      .createQueryBuilder()
      .select('sum(sum) as value')
      .addSelect('series')
      .addSelect('time')
      .andWhere('key = :metric', { metric })
      .andWhere(`time between now() - INTERVAL '1 day' and now()`)
      .orderBy('sum', 'DESC')
      .groupBy('series, sum, time');
    if (series) {
      query.andWhere('series = :series', { series });
    }
    const [response, count] = await Promise.all([query.offset(offset).limit(limit).getRawMany(), query.getCount()]);
    if (series && count === 0) {
      return [[new AnalyticsAggregateValue({ value: 0, series: series })], 1];
    }

    return [response?.map((row) => AnalyticsAggregateValue.fromTimescaleObject(row)) ?? [], count ?? 0];
  }

  async getVolumeDataWithMarketplaces({ time, series, metric, start }: AnalyticsArgs): Promise<AnalyticsAggregateValue[]> {
    const [startDate, endDate] = computeTimeInterval(time, start);
    const query = await this.sumMarketplaceDaily
      .createQueryBuilder()
      .select("time_bucket_gapfill('1 day', time) as timestamp")
      .addSelect('sum(sum) as value')
      .addSelect(
        'sum(sum) as value, sum(xoxno) as xoxno, sum(frameit) as frameit, sum(elrondapes) as elrondapes, sum(deadrare) as deadrare, sum(hoghomies) as hoghomies, sum(elrondnftswap) as elrondnftswap, sum(aquaverse) as aquaverse, sum(holoride) as holoride, sum(eneftor) as eneftor,sum(ici) as ici  ',
      )
      .where('key = :metric', { metric })
      .andWhere('series = :series', { series })
      .andWhere(endDate ? 'time BETWEEN :startDate AND :endDate' : 'time >= :startDate', { startDate, endDate })
      .orderBy('timestamp', 'ASC')
      .groupBy('timestamp')
      .getRawMany();

    return query?.map((row) => AnalyticsAggregateValue.fromTimescaleObjectWithMarketplaces(row)) ?? [];
  }

  async getFloorPriceData({ time, series, metric, start }: AnalyticsArgs): Promise<AnalyticsAggregateValue[]> {
    const [startDate, endDate] = computeTimeInterval(time, start);
    const query = await this.floorPriceDaily
      .createQueryBuilder()
      .select("time_bucket_gapfill('1 day', time) as timestamp")
      .addSelect('locf(min(min)) as value')
      .where('key = :metric', { metric })
      .andWhere('series = :series', { series })
      .andWhere(endDate ? 'time BETWEEN :startDate AND :endDate' : 'time >= :startDate', { startDate, endDate })
      .orderBy('timestamp', 'ASC')
      .groupBy('timestamp')
      .getRawMany();

    return query?.map((row) => AnalyticsAggregateValue.fromTimescaleObject(row)) ?? [];
  }
}
