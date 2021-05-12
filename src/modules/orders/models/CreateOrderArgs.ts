import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateOrderArgs {
  @Field(() => String)
  priceTokenIdentifier: string;
  @Field(() => String)
  priceAmount: string;
  @Field(() => String)
  priceNonce: string;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => Number)
  auctionId: number;
}
