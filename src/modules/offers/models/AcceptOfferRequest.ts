import { AcceptOfferArgs } from './AcceptOfferArgs';

export class AcceptOfferRequest {
  auctionId: number;
  offerId: number;

  constructor(init?: Partial<AcceptOfferRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: AcceptOfferArgs) {
    return new AcceptOfferRequest({
      auctionId: args.auctionId,
      offerId: args.offerId,
    });
  }
}
