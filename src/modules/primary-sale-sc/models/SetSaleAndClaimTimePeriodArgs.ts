import { Field, InputType, Int } from '@nestjs/graphql';
import { Matches, MaxLength, MinLength } from 'class-validator';
import {
  COLLECTION_IDENTIFIER_RGX,
  COLLECTION_IDENTIFIER_ERROR,
} from 'src/utils/constants';

@InputType()
export class SetSaleClaimPeriodArgs {
  @Field(() => String)
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  collectionIdentifier: string;

  @Field(() => Int)
  startSale: number;

  @Field(() => Int)
  endSale: number;

  @Field(() => Int)
  startClaim: number;

  @Field(() => Int)
  endClaim: number;
}
