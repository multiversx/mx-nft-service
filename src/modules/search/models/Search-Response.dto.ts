import { Field, ID, ObjectType } from '@nestjs/graphql';
import { SearchItemResponse } from './SearchItemResponse';

@ObjectType()
export class SearchResponse {
  @Field(() => ID, { nullable: true })
  searchTerm: string;
  @Field(() => [SearchItemResponse], { nullable: true })
  collections: SearchItemResponse[];
  @Field(() => [SearchItemResponse], { nullable: true })
  nfts: SearchItemResponse[];
  @Field(() => [SearchItemResponse], { nullable: true })
  accounts: SearchItemResponse[];
  @Field(() => [SearchItemResponse], { nullable: true })
  tags: SearchItemResponse[];

  constructor(init?: Partial<SearchResponse>) {
    Object.assign(this, init);
  }
}
