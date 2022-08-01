import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  NftCollectionResponse,
  SearchItemResponse,
} from './SearchItemResponse';

@ObjectType()
export class SearchResponse {
  @Field(() => ID, { nullable: true })
  searchTerm: string;
  @Field(() => [NftCollectionResponse], { nullable: true })
  collections: NftCollectionResponse[];
  @Field(() => [NftCollectionResponse], { nullable: true })
  nfts: NftCollectionResponse[];
  @Field(() => [SearchItemResponse], { nullable: true })
  accounts: SearchItemResponse[];
  @Field(() => [SearchItemResponse], { nullable: true })
  tags: SearchItemResponse[];

  constructor(init?: Partial<SearchResponse>) {
    Object.assign(this, init);
  }
}
