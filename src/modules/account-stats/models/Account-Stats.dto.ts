import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats.entity';
import { nominateAmount } from 'src/utils/formatters';

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

  static fromEntity(account: AccountStatsEntity, address: string = '') {
    return account
      ? new AccountStats({
          address: address,
          auctions: account.auctions,
          biddingBalance: nominateAmount(account.biddingBalance),
          orders: account.orders,
        })
      : new AccountStats({ address: address });
  }
}
