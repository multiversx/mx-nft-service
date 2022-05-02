import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BrandInfo } from '.';

@ObjectType()
export class MintPrice {
  @Field(() => ID)
  token: string;
  @Field(() => Int)
  startTimestamp: number;
  @Field()
  amount: string;
  @Field(() => Int)
  nonce: number;

  constructor(init?: Partial<MintPrice>) {
    Object.assign(this, init);
  }

  static fromEntity(auction: BrandInfo) {
    return new MintPrice({});
  }
}
