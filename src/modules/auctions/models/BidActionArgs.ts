import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, Matches } from 'class-validator';
import { mxConfig } from 'src/config';
import {
  EGLD_OR_ESDT_TOKEN_RGX,
  ESDT_TOKEN_ERROR,
  NFT_IDENTIFIER_ERROR,
  NFT_IDENTIFIER_RGX,
  NUMERIC_ERROR,
  NUMERIC_RGX,
} from 'src/utils/constants';

@InputType()
export class BidActionArgs {
  @Field(() => Int)
  auctionId: number;

  @Matches(RegExp(NFT_IDENTIFIER_RGX), {
    message: NFT_IDENTIFIER_ERROR,
  })
  @Field(() => String)
  identifier: string;

  @Matches(RegExp(EGLD_OR_ESDT_TOKEN_RGX), {
    message: ESDT_TOKEN_ERROR,
  })
  @Field(() => String)
  paymentTokenIdentifier: string = mxConfig.egld;

  @Field(() => String)
  price: string;
}

@InputType()
export class BuySftActionArgs {
  @Field(() => Int)
  auctionId: number;

  @Matches(RegExp(NFT_IDENTIFIER_RGX), {
    message: NFT_IDENTIFIER_ERROR,
  })
  @Field(() => String)
  identifier: string;

  @Matches(RegExp(EGLD_OR_ESDT_TOKEN_RGX), {
    message: ESDT_TOKEN_ERROR,
  })
  @Field(() => String)
  paymentTokenIdentifier: string = mxConfig.egld;

  @Matches(RegExp(NUMERIC_RGX), { message: `Price ${NUMERIC_ERROR}` })
  @Field(() => String)
  price: string;

  @IsOptional()
  @Matches(RegExp(NUMERIC_RGX), { message: `Quantity ${NUMERIC_ERROR}` })
  @Field(() => String, { nullable: true })
  quantity: string;
}
