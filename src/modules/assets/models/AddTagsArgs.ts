import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AddTagsArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => [String])
  tags: [string];
}
