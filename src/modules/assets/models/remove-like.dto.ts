import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class RemoveLikeArgs {
  @Field(() => String)
  identifier: string;
  @Field(() => String)
  address: string;
}
