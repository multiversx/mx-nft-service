import { Field, InputType, Int } from '@nestjs/graphql';
import { Matches, MaxLength, MinLength } from 'class-validator';
import {
  COLLECTION_IDENTIFIER_ERROR,
  COLLECTION_IDENTIFIER_RGX,
  NUMERIC_ERROR,
  NUMERIC_RGX,
} from 'src/utils/constants';

@InputType()
export class BuyTicketsArgs {
  @Field(() => String)
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  collectionIdentifier: string;
  @Field(() => Int)
  ticketsNumber: number;

  @Field(() => String)
  @Matches(RegExp(NUMERIC_RGX), { message: `Price ${NUMERIC_ERROR}` })
  price: string;
}
