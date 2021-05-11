import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Tag {
  @Field(() => ID)
  id: string;
  @Field(() => String)
  tag: string;
  @Field(() => String)
  tokenId: string;
}
