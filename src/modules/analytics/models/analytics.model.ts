import { HistoricalValue } from '@multiversx/sdk-data-api-client';
import { DataApiHistoricalResponse } from '@multiversx/sdk-data-api-client/lib/src/responses';
import { Field, ObjectType } from '@nestjs/graphql';
import BigNumber from 'bignumber.js';
import moment from 'moment';

@ObjectType()
export class HistoricDataModel {
  @Field()
  timestamp: string;
  @Field()
  value: string;
  @Field({ nullable: true })
  series: string;

  constructor(init?: Partial<HistoricDataModel>) {
    Object.assign(this, init);
  }

  static fromDataApiResponse(
    row: DataApiHistoricalResponse,
    aggregate: HistoricalValue,
  ) {
    return new HistoricDataModel({
      timestamp: moment.utc(row.timestamp * 1000).format('yyyy-MM-DD HH:mm:ss'),
      value: new BigNumber(row[aggregate] ?? '0').toFixed(),
    });
  }

  static fromCompleteValues({ field, value, series }, type: 'last' | 'sum') {
    return new HistoricDataModel({
      timestamp: moment.utc(field).format('yyyy-MM-DD HH:mm:ss'),
      value: value ? new BigNumber(value[type] ?? '0').toFixed() : '0',
      series: series
    });
  }
}
