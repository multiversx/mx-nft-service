import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class BidActionArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => String)
  price: string;
  @Field(() => String)
  tokenNonce: string;
}
