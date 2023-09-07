import { registerEnumType } from '@nestjs/graphql';

export enum TimeResolutionsEnum {
  INTERVAL_1_MINUTE = 'INTERVAL_1_MINUTE',
  INTERVAL_10_MINUTES = 'INTERVAL_10_MINUTES',
  INTERVAL_30_MINUTES = 'INTERVAL_30_MINUTES',
  INTERVAL_HOUR = 'INTERVAL_HOUR',
  INTERVAL_DAY = 'INTERVAL_DAY',
  INTERVAL_WEEK = 'INTERVAL_WEEK',
  INTERVAL_MONTH = 'INTERVAL_MONTH',
}

registerEnumType(TimeResolutionsEnum, {
  name: 'TimeResolutionsEnum',
});
