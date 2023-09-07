import { Field, ID, ObjectType } from '@nestjs/graphql';
import { SearchNftCollectionResponse, SearchItemResponse } from './SearchItemResponse';

@ObjectType()
export class SearchResponse {
  @Field(() => ID, { nullable: true })
  searchTerm: string;
  @Field(() => [SearchNftCollectionResponse], { nullable: true })
  collections: SearchNftCollectionResponse[];
  @Field(() => [SearchNftCollectionResponse], { nullable: true })
  nfts: SearchNftCollectionResponse[];
  @Field(() => [SearchItemResponse], { nullable: true })
  accounts: SearchItemResponse[];
  @Field(() => [SearchItemResponse], { nullable: true })
  tags: SearchItemResponse[];

  constructor(init?: Partial<SearchResponse>) {
    Object.assign(this, init);
  }
}
