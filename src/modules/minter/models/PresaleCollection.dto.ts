import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BrandInfo } from '.';
import { MintPrice } from './MintPrice.dto';

@ObjectType()
export class PresaleCollection {
  @Field(() => ID)
  campaignId!: string;
  @Field(() => String)
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

  @Field(() => MintPrice)
  mintPrice: MintPrice;

  constructor(init?: Partial<PresaleCollection>) {
    Object.assign(this, init);
  }

  static fromEntity(auction: BrandInfo) {
    return new PresaleCollection({});
  }
}
