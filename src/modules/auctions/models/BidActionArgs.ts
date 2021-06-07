import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class BidActionArgs {
  @Field(() => Int)
  auctionId: number;
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => String)
  price: string;
  @Field(() => String)
  tokenNonce: string;
}
