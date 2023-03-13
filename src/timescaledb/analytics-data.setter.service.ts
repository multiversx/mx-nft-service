import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { TimestreamWrite } from 'aws-sdk';
import * as moment from 'moment';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XNftsAnalyticsEntity } from './entities/analytics.entities';
import { AnalyticsSetterInterface } from './interfaces/analytics.setter.interface';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';

@Injectable()
export class AnalyticsDataSetterService implements AnalyticsSetterInterface {
  constructor(
    private readonly logger: Logger,
    @InjectRepository(XNftsAnalyticsEntity)
    private readonly dexAnalytics: Repository<XNftsAnalyticsEntity>,
  ) {}

  async ingest({ data, Time }) {
    try {
      const records = this.createRecords({ data, Time });
      await this.writeRecords(records);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async multiRecordsIngest(
    _tableName: string,
    Records: TimestreamWrite.Records,
  ) {
    try {
      const ingestRecords = this.convertAWSRecordsToDataAPIRecords(Records);
      await this.writeRecords(ingestRecords);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async writeRecords(records: XNftsAnalyticsEntity[]): Promise<void> {
    const profiler = new PerformanceProfiler('ingestData');

    try {
      this.dexAnalytics.save(records);
    } catch (errors) {
      this.logger.error(errors);
    } finally {
      profiler.stop();

      MetricsCollector.setExternalCall(
        AnalyticsDataSetterService.name,
        profiler.duration,
        'ingestData',
      );
    }
  }

  createRecords({ data, Time }): XNftsAnalyticsEntity[] {
    const records: XNftsAnalyticsEntity[] = [];
    Object.keys(data).forEach((series) => {
      Object.keys(data[series]).forEach((key) => {
        const value = data[series][key].toString();
        records.push(
          new XNftsAnalyticsEntity({
            series,
            key,
            value,
            timestamp: moment.unix(Time).toDate(),
          }),
        );
      });
    });
    return records;
  }

  private convertAWSRecordsToDataAPIRecords(
    Records: TimestreamWrite.Records,
  ): XNftsAnalyticsEntity[] {
    const ingestRecords = Records.map((record) => {
      return new XNftsAnalyticsEntity({
        timestamp: moment.unix(parseInt(record.Time)).toDate(),
        series: record.Dimensions[0].Value,
        key: record.MeasureName,
        value: record.MeasureValue,
      });
    });
    return ingestRecords;
  }
}
