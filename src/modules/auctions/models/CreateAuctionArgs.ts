import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateAuctionArgs {
  @Field(() => String!)
  ownerAddress: string;

  @Field(() => String!)
  tokenIdentifier: string;

  @Field(() => String!)
  nonce: string;

  @Field(() => String!)
  minBid: string;

  @Field(() => String!)
  maxBid: string;

  @Field(() => String!)
  deadline: string;

  @Field(() => String!)
  paymentTokenIdentifier: String;
}
