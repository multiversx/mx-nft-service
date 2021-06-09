import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateOrderArgs {
  @Field()
  priceToken: string;
  @Field()
  priceAmount: string;
  @Field(() => Int)
  priceNonce: number;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => Int)
  auctionId: number;
}
