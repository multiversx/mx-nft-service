import { registerEnumType } from '@nestjs/graphql';

export enum TimeRangeEnum {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  ALL = 'ALL',
}

registerEnumType(TimeRangeEnum, { name: 'TimeRange' });
