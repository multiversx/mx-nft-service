import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AccountStats {
  @Field(() => ID, { nullable: true })
  address: string;
  @Field({ nullable: true })
  biddingBalance: string;
  @Field({ nullable: true })
  creations: string;
  @Field({ nullable: true })
  collected: string;
  @Field({ nullable: true })
  collections: string;
  @Field({ nullable: true })
  auctions: string;
  @Field({ nullable: true })
  orders: string;
  @Field({ nullable: true })
  claimable: string;

  constructor(init?: Partial<AccountStats>) {
    Object.assign(this, init);
  }
}
