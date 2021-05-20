import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TokenActionArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => String)
  tokenNonce: string;
}
