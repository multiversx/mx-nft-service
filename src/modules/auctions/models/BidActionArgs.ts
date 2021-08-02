import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class BidActionArgs {
  @Field(() => Int)
  auctionId: number;
  @Field(() => String)
  collection: string;
  @Field(() => String)
  price: string;
  @Field(() => String)
  nonce: string;
}

@InputType()
export class BuySftActionArgs {
  @Field(() => Int)
  auctionId: number;
  @Field(() => String)
  collection: string;
  @Field(() => String)
  price: string;
  @Field(() => String)
  nonce: string;
}
