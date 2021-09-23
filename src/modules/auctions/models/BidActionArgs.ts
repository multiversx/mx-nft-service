import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class BidActionArgs {
  @Field(() => Int)
  auctionId: number;
  @Field(() => String)
  identifier: string;
  @Field(() => String)
  price: string;
}

@InputType()
export class BuySftActionArgs {
  @Field(() => Int)
  auctionId: number;
  @Field(() => String)
  identifier: string;
  @Field(() => String)
  price: string;
}
