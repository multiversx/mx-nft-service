import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateAuctionArgs {
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
