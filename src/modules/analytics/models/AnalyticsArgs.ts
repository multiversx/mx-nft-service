import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, Matches } from 'class-validator';
import {
  COLLECTION_IDENTIFIER_ERROR,
  COLLECTION_IDENTIFIER_RGX,
} from 'src/utils/constants';

@InputType()
export class AnalyticsArgs {
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String)
  series: string;
  @Field()
  metric: string;
  @IsOptional()
  @Field({ nullable: true })
  @Matches(new RegExp('[1-60][s,m,h,d]'))
  time: string;
  @IsOptional()
  @Field({ nullable: true })
  start: string;
  @IsOptional()
  @Field({ nullable: true })
  @Matches(new RegExp('[1-60][s,m,h,d]'))
  bin: string;
}
