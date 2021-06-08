import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateAuctionArgs {
  @Field(() => String)
  ownerAddress: string;

  @Field(() => String)
  token: string;

  @Field(() => String)
  nonce: string;

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
}
