import { Injectable, Logger } from '@nestjs/common';
import { TimestreamWrite } from 'aws-sdk';
import * as moment from 'moment';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XNftsAnalyticsEntity } from './entities/analytics.entity';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';

@Injectable()
export class AnalyticsDataSetterService {
  private pendingRecords: XNftsAnalyticsEntity[] = [];
  constructor(
    private readonly logger: Logger,
    @InjectRepository(XNftsAnalyticsEntity, 'timescaledb')
    private nftAnalyticsRepo: Repository<XNftsAnalyticsEntity>,
  ) {}

  async ingest({ data, timestamp, ingestLast }): Promise<void> {
    if (!ingestLast) {
      const newRecordsToIngest = this.createRecords({ data, timestamp });
      this.pendingRecords.push(...newRecordsToIngest);

      if (this.pendingRecords.length < 20) {
        return;
      }
    }

    try {
      const query = this.nftAnalyticsRepo
        .createQueryBuilder()
        .insert()
        .into(XNftsAnalyticsEntity)
        .values(this.pendingRecords)
        .orUpdate(['value'], ['timestamp', 'series', 'key']);

      await query.execute();

      this.pendingRecords = [];
    } catch (error) {
      console.log(
        `Could not insert ${this.pendingRecords.length} records into TimescaleDb`,
      );
      console.log(error);
      throw error;
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
      this.nftAnalyticsRepo.save(records);
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

  createRecords({ data, timestamp }): XNftsAnalyticsEntity[] {
    const records: XNftsAnalyticsEntity[] = [];
    Object.keys(data).forEach((series) => {
      Object.keys(data[series]).forEach((key) => {
        if (key === 'paymentToken' || key === 'marketplaceKey') {
          return;
        }
        const value = data[series][key].toString();
        records.push(
          new XNftsAnalyticsEntity({
            series,
            key,
            value,
            timestamp: moment.unix(timestamp).toDate(),
            paymentToken: data[series]['paymentToken'].toString(),
            marketplaceKey: data[series]['marketplaceKey'].toString(),
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
