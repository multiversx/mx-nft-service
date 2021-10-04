import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class HandleQuantityArgs {
  @Field(() => String)
  addOrBurnRoleAddress: string;

  @Field(() => String)
  identifier: string;

  @Field(() => String)
  quantity: string;
}
