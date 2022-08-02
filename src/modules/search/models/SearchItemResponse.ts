import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SearchItemResponse {
  @Field(() => String, { nullable: true })
  name: string;
  @Field(() => String)
  identifier: string;

  constructor(init?: Partial<SearchItemResponse>) {
    Object.assign(this, init);
  }
}

@ObjectType()
export class SearchNftCollectionResponse extends SearchItemResponse {
  @Field(() => Boolean)
  verified: boolean;

  constructor(init?: Partial<SearchNftCollectionResponse>) {
    super();
    Object.assign(this, init);
  }
}
