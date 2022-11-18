import { BuySftActionArgs } from '..';

export class BuySftRequest {
  auctionId: number;
  identifier: string;
  tokenIdentifier?: string;
  price: string;
  quantity: string;
  constructor(init?: Partial<BuySftRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(buySftArgs: BuySftActionArgs) {
    return new BuySftRequest({
      identifier: buySftArgs.identifier,
      auctionId: buySftArgs.auctionId,
      tokenIdentifier: buySftArgs.tokenIdentifier,
      price: buySftArgs.price,
      quantity: buySftArgs.quantity,
    });
  }
}
