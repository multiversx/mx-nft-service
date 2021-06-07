import { Field, InputType, Int } from '@nestjs/graphql';
@InputType()
export class AddLikeArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => Int)
  tokenNonce: number;
  @Field(() => String)
  address: string;
}
