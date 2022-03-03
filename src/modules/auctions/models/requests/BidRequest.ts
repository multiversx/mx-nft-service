import { BidActionArgs } from '../BidActionArgs';

export class BidRequest {
  auctionId: number;
  identifier: string;
  price: string;
  constructor(init?: Partial<BidRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(bidArgs: BidActionArgs) {
    return new BidRequest({
      identifier: bidArgs.identifier,
      auctionId: bidArgs.auctionId,
      price: bidArgs.price,
    });
  }
}
