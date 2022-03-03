import { BuySftActionArgs } from '..';

export class BuySftRequest {
  auctionId: number;
  identifier: string;
  price: string;
  quantity: string;
  constructor(init?: Partial<BuySftRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(buySftArgs: BuySftActionArgs) {
    return new BuySftRequest({
      identifier: buySftArgs.identifier,
      auctionId: buySftArgs.auctionId,
      price: buySftArgs.price,
      quantity: buySftArgs.quantity,
    });
  }
}
