import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateAuctionArgs {
  @Field(() => String)
  ownerAddress: string;

  @Field(() => String)
  token: string;

  @Field(() => Int)
  nonce: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => String)
  minBid: string;

  @Field(() => String)
  maxBid: string;

  @Field(() => String)
  startDate: string;

  @Field(() => String)
  deadline: string;

  @Field(() => String)
  paymentToken: string;

  @Field(() => Int)
  paymentTokenNonce: number;

  @Field(() => Boolean)
  maxOneSftPerPayment: boolean;
}
