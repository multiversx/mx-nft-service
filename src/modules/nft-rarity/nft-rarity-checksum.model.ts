import { Field, ObjectType } from '@nestjs/graphql';
import BigNumber from 'bignumber.js';

@ObjectType()
export class NftRarityChecksum {
  @Field()
  rank: BigNumber;

  @Field()
  score: BigNumber;

  constructor(init?: Partial<NftRarityChecksum>) {
    Object.assign(this, init);
  }
}
