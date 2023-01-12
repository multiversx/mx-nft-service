import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AcceptOfferArgs {
  @Field(() => Int, { nullable: true })
  auctionId: number;

  @Field(() => Int, { nullable: true })
  offerId: number;
}
