import { HistoricDataModel } from 'src/modules/analytics/models/analytics.model';
import { AnalyticsArgs } from './analytics.query';

export interface AnalyticsGetterInterface {
  getAggregatedValue(args: AnalyticsArgs): Promise<string>;

  getLatestCompleteValues(args: AnalyticsArgs): Promise<HistoricDataModel[]>;

  getSumCompleteValues(args: AnalyticsArgs): Promise<HistoricDataModel[]>;

  getValues24h(args: AnalyticsArgs): Promise<HistoricDataModel[]>;

  getValues24hSum(args: AnalyticsArgs): Promise<HistoricDataModel[]>;

  getLatestHistoricData(args: AnalyticsArgs): Promise<HistoricDataModel[]>;

  getLatestBinnedHistoricData(
    args: AnalyticsArgs,
  ): Promise<HistoricDataModel[]>;
}
