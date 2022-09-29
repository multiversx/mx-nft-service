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
