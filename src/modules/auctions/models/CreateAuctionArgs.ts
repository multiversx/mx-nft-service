import { Field, InputType, Int } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { NFT_IDENTIFIER_ERROR, NFT_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class CreateAuctionArgs {
  @Matches(RegExp(NFT_IDENTIFIER_RGX), {
    message: NFT_IDENTIFIER_ERROR,
  })
  @Field()
  identifier: string;

  @Field(() => String)
  quantity: string = '1';

  @Field()
  minBid: string;

  @Field({ nullable: true })
  maxBid: string;

  @Field({ nullable: true })
  startDate: string;

  @Field()
  deadline: string;

  @Field()
  paymentToken: string;

  @Field(() => Int, { nullable: true })
  paymentTokenNonce: number;

  @Field(() => Boolean, { nullable: true })
  maxOneSftPerPayment: boolean;
}
