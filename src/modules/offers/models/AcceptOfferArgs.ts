import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, Matches } from 'class-validator';
import {
  NFT_IDENTIFIER_ERROR,
  NFT_IDENTIFIER_RGX,
  NUMERIC_ERROR,
  NUMERIC_RGX,
} from 'src/utils/constants';

@InputType()
export class AcceptOfferArgs {
  @Field(() => Int, { nullable: true })
  auctionId: number;

  @Field(() => Int, { nullable: true })
  offerId: number;
}
