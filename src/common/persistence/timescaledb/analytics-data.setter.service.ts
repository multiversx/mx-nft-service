import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XNftsAnalyticsEntity } from './entities/analytics.entity';

@Injectable()
export class AnalyticsDataSetterService {
  private pendingRecords: XNftsAnalyticsEntity[] = [];
  constructor(
    private readonly logger: Logger,
    @InjectRepository(XNftsAnalyticsEntity, 'timescaledb')
    private nftAnalyticsRepo: Repository<XNftsAnalyticsEntity>,
  ) { }

  async ingest({ data, timestamp, ingestLast }): Promise<void> {
    if (!ingestLast) {
      const newRecordsToIngest = this.createRecords({ data, timestamp });
      this.pendingRecords.push(...newRecordsToIngest);

      if (this.pendingRecords.length < 20) {
        return;
      }
    }

    try {
      console.log(JSON.stringify(this.pendingRecords))
      const query = this.nftAnalyticsRepo
        .createQueryBuilder()
        .insert()
        .into(XNftsAnalyticsEntity)
        .values(this.pendingRecords)
        .orUpdate(['value'], ['timestamp', 'series', 'key']);

      await query.execute();

      this.pendingRecords = [];
    } catch (error) {
      this.logger.error(
        `Could not insert ${this.pendingRecords.length} records into TimescaleDb, ${error}}`,
      );
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
      this.logger.error(
        `Could not insert ${data} records into TimescaleDb, ${error}}`,
      );
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
        // console.log({
        //   date:
        //     moment.unix(timestamp).toDate(),
        //   np: new Date(timestamp * 1000),
        // })
        const value = data[series][key].toString();
        records.push(
          new XNftsAnalyticsEntity({
            series,
            key,
            value,
            timestamp: new Date(timestamp * 1000),
            paymentToken: data[series]['paymentToken'].toString(),
            marketplaceKey: data[series]['marketplaceKey'].toString(),
          }),
        );
      });
    });
    return records;
  }
}
