import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SearchResponse {
  @Field(() => ID, { nullable: true })
  serchTerm: string;
  @Field(() => [String], { nullable: true })
  collections: string[];
  @Field(() => [String], { nullable: true })
  nfts: string[];
  @Field(() => [String], { nullable: true })
  accounts: string[];

  constructor(init?: Partial<SearchResponse>) {
    Object.assign(this, init);
  }
}
