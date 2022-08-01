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
export class NftCollectionResponse extends SearchItemResponse {
  @Field(() => Boolean, { nullable: true })
  verified: boolean;

  constructor(init?: Partial<NftCollectionResponse>) {
    super();
    Object.assign(this, init);
  }
}
