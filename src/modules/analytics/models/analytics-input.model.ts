import { Field, InputType } from '@nestjs/graphql';
import { TimeResolutionsEnum } from './time-resolutions.enum';
import { TimeRangeEnum } from './time-range.enum';

@InputType()
export class AnalyticsInput {
  @Field(() => TimeResolutionsEnum, { name: 'resolution', nullable: true })
  resolution?: TimeResolutionsEnum;

  @Field(() => TimeRangeEnum, { name: 'range', nullable: true })
  range?: TimeRangeEnum;
}
