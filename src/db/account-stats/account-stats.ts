export class AccountStatsEntity {
  address: string;
  biddingBalance: string;
  auctions: string;
  orders: string;
  claimable: string;

  constructor(init?: Partial<AccountStatsEntity>) {
    Object.assign(this, init);
  }
}
