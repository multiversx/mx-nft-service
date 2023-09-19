import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XNftsAnalyticsEntity } from './entities/analytics.entity';
import { DateUtils } from 'src/utils/date-utils';

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

      if (this.pendingRecords.length < 1000) {
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
      this.logger.error(`Could not insert ${this.pendingRecords.length} records into TimescaleDb, ${error}, ${timestamp}`);
      throw error;
    }
  }

  async ingestSingleEvent({ data, timestamp }): Promise<void> {
    const newRecordsToIngest = this.createRecords({ data, timestamp });

    try {
      const query = this.nftAnalyticsRepo
        .createQueryBuilder()
        .insert()
        .into(XNftsAnalyticsEntity)
        .values(newRecordsToIngest)
        .orUpdate(['value'], ['timestamp', 'series', 'key']);

      await query.execute();
    } catch (error) {
      this.logger.error(`Could not insert ${data} records into TimescaleDb, ${error}}`);
      throw error;
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
            timestamp: DateUtils.getDatewithTimezoneInfo(timestamp),
            paymentToken: data[series]['paymentToken'].toString(),
            marketplaceKey: data[series]['marketplaceKey'].toString(),
          }),
        );
      });
    });
    return records;
  }
}
