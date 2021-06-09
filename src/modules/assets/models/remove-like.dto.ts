import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class RemoveLikeArgs {
  @Field(() => String)
  token: string;
  @Field(() => Int)
  nonce: number;
  @Field(() => String)
  address: string;
}
