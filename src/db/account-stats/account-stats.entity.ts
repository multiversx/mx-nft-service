export class AccountStatsEntity {
  address: string;
  biddingBalance: string;
  Collected: string;
  Collections: string;
  Auctions: string;
  Orders: string;
  Claimable: string;

  constructor(init?: Partial<AccountStatsEntity>) {
    Object.assign(this, init);
  }
}
