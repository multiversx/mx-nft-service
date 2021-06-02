import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AddLikeArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => Number)
  tokenNonce: number;
  @Field(() => String)
  address: string;
}
