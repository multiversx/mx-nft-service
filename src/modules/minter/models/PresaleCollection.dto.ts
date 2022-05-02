import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BrandInfo } from '.';

@ObjectType()
export class PresaleCollection {
  @Field(() => ID)
  minterAddress!: string;

  @Field(() => String)
  collectionName: string;

  @Field(() => String)
  mediaType: string;

  @Field(() => String)
  collectionTicker: string;

  @Field(() => String)
  collectionHash: string;

  @Field(() => Int)
  totalNfts: number;

  @Field(() => Int)
  availableNfts: number;

  constructor(init?: Partial<PresaleCollection>) {
    Object.assign(this, init);
  }

  static fromEntity(auction: BrandInfo) {
    return new PresaleCollection({});
  }
}
