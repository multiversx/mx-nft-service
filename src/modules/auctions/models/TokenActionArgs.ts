import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TokenActionArgs {
  @Field(() => String)
  auctionId: string;
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => String)
  nonce: string;
}
