import { TimestreamWrite } from 'aws-sdk';

export interface AnalyticsSetterInterface {
  ingest({ TableName, data, Time }): Promise<void>;

  multiRecordsIngest(
    TableName: string,
    Records: TimestreamWrite.Records,
  ): Promise<void>;
}
