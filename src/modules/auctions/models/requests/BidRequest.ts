import { BidActionArgs } from '../BidActionArgs';

export class BidRequest {
  auctionId: number;
  identifier: string;
  paymentTokenIdentifier: string;
  price: string;
  constructor(init?: Partial<BidRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(bidArgs: BidActionArgs) {
    return new BidRequest({
      identifier: bidArgs.identifier,
      auctionId: bidArgs.auctionId,
      paymentTokenIdentifier: bidArgs.paymentTokenIdentifier,
      price: bidArgs.price,
    });
  }
}
