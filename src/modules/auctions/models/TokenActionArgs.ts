import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TokenActionArgs {
  @Field(() => String)
  token: string;
  @Field(() => String)
  nonce: string;
}
