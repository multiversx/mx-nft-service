import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class BidActionArgs {
  @Field(() => String)
  token: string;
  @Field(() => String)
  price: string;
  @Field(() => String)
  nonce: string;
}
