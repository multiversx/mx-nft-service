import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { Price } from 'src/modules/assets/models/Price.dto';
import { nominateAmount } from 'src/utils';

@ObjectType()
export class AccountStats {
  @Field(() => ID, { nullable: true })
  address: string;
  @Field({ nullable: true })
  biddingBalance: string;
  @Field(() => [Price], { nullable: true })
  biddings: Price[];
  @Field({ nullable: true })
  creations: string;
  @Field({ nullable: true })
  likes: string;
  @Field({ nullable: true })
  collected: string;
  @Field({ nullable: true })
  collections: string;
  @Field({ nullable: true })
  auctions: string;
  @Field({ nullable: true })
  orders: string;
  @Field({ nullable: true })
  offers: string;
  @Field({ nullable: true })
  claimable: string;
  @Field({ nullable: true })
  marketplaceKey: string;

  constructor(init?: Partial<AccountStats>) {
    Object.assign(this, init);
  }

  static fromEntity(account: AccountStatsEntity, address: string = '', marketplaceKey: string = null) {
    return account
      ? new AccountStats({
          address: address,
          auctions: account.auctions,
          biddingBalance: nominateAmount(account.biddingBalance),
          orders: account.orders,
          marketplaceKey: marketplaceKey,
        })
      : new AccountStats({ address: address, marketplaceKey: marketplaceKey });
  }
}
