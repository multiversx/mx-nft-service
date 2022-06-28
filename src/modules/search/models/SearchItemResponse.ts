import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SearchItemResponse {
  @Field(() => String, { nullable: true })
  name: string;
  @Field(() => String, { nullable: true })
  identifier: string;

  constructor(init?: Partial<SearchItemResponse>) {
    Object.assign(this, init);
  }
}
