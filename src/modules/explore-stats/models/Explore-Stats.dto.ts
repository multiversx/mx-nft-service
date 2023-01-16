import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExploreStats {
  @Field(() => Int)
  nfts: number;
  @Field(() => Int)
  collections: number;
  @Field(() => Int)
  artists: number;

  constructor(init?: Partial<ExploreStats>) {
    Object.assign(this, init);
  }
}

@ObjectType()
export class ExploreCollectionsStats {
  @Field(() => Int)
  allCollectionsCount: number;
  @Field(() => Int)
  verifiedCount: number;
  @Field(() => Int)
  activeLast30DaysCount: number;

  constructor(init?: Partial<ExploreCollectionsStats>) {
    Object.assign(this, init);
  }
}

@ObjectType()
export class ExploreNftsStats {
  @Field(() => Int)
  allNftsCount: number;
  @Field(() => Int)
  liveAuctionsCount: number;
  @Field(() => Int)
  buyNowCount: number;
  @Field(() => Int)
  offersCount: number;

  constructor(init?: Partial<ExploreNftsStats>) {
    Object.assign(this, init);
  }
}
