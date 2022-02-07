import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AccountStats {
  @Field(() => ID, { nullable: true })
  address: string;
  @Field({ nullable: true })
  biddingBalance: string;
  @Field({ nullable: true })
  Collected: string;
  @Field({ nullable: true })
  Collections: string;
  @Field({ nullable: true })
  Auctions: string;
  @Field({ nullable: true })
  Orders: string;
  @Field({ nullable: true })
  Claimable: string;

  constructor(init?: Partial<AccountStats>) {
    Object.assign(this, init);
  }
}
