import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateAuctionArgs {
  @Field(() => String)
  ownerAddress: string;

  @Field(() => String)
  tokenIdentifier: string;

  @Field(() => String)
  nonce: string;

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
  paymentTokenIdentifier: string;

  @Field(() => String)
  paymentTokenNonce: string;

  @Field(() => Boolean)
  maxOneSftPerPayment: boolean;
}
