import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NftRarityChecksum {
  @Field()
  rank: number;

  @Field()
  score: number;

  constructor(init?: Partial<NftRarityChecksum>) {
    Object.assign(this, init);
  }
}
