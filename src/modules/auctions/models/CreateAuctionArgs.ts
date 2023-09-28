import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, Matches } from 'class-validator';
import { NFT_IDENTIFIER_ERROR, NFT_IDENTIFIER_RGX, NUMERIC_ERROR, NUMERIC_RGX } from 'src/utils/constants';

@InputType()
export class CreateAuctionArgs {
  @Matches(RegExp(NFT_IDENTIFIER_RGX), {
    message: NFT_IDENTIFIER_ERROR,
  })
  @Field()
  identifier: string;

  @Matches(RegExp(NUMERIC_RGX), { message: `Quantity ${NUMERIC_ERROR}` })
  @Field(() => String)
  quantity: string = '1';

  @Matches(RegExp(NUMERIC_RGX), { message: `Min Bid ${NUMERIC_ERROR}` })
  @Field()
  minBid: string;

  @IsOptional()
  @Matches(RegExp(NUMERIC_RGX), { message: `Max bid ${NUMERIC_ERROR}` })
  @Field({ nullable: true })
  maxBid: string;

  @IsOptional()
  @Matches(RegExp(NUMERIC_RGX), { message: `Start Date ${NUMERIC_ERROR}` })
  @Field({ nullable: true })
  startDate: string;

  @IsOptional()
  @Matches(RegExp(NUMERIC_RGX), { message: `Deadline ${NUMERIC_ERROR}` })
  @Field()
  deadline: string;

  @Field()
  paymentToken: string;

  @Field(() => Int, { nullable: true })
  paymentTokenNonce: number;

  @Field(() => Boolean, { nullable: true })
  maxOneSftPerPayment: boolean;

  @Field()
  marketplaceKey: string;
}
