import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, Matches } from 'class-validator';
import { COLLECTION_IDENTIFIER_ERROR, COLLECTION_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class CollectionAnalyticsArgs {
  @IsOptional()
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String, { nullable: true })
  series: string;
}

@InputType()
export class AnalyticsArgs {
  @IsOptional()
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String, { nullable: true })
  series: string;
  @Field()
  metric: string;
  @IsOptional()
  @Field({ nullable: true })
  @Matches(new RegExp('^(?:[1-9]|[1-5][0-9]|60)[s,m,h,d]$'))
  time: string;
}
