import { Field, InputType, Int } from '@nestjs/graphql';
@InputType()
export class AddLikeArgs {
  @Field(() => String)
  identifier: string;
}
