import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class HandleQuantityArgs {
  @Field(() => String)
  addOrBurnRoleAddress: string;

  @Field(() => String)
  token: string;

  @Field(() => Int)
  nonce: number;

  @Field(() => Int)
  quantity: number;
}
