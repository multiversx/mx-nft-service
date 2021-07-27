import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateAuctionArgs {
  @Field()
  collection: string;

  @Field(() => Int)
  nonce: number;

  @Field(() => Int)
  quantity: number;

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
