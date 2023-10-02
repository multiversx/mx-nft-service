import { CreateAuctionArgs } from '../CreateAuctionArgs';

export class CreateAuctionRequest {
  identifier: string;
  quantity: string = '1';
  minBid: string;
  maxBid: string;
  startDate: string;
  deadline: string;
  paymentToken: string;
  paymentTokenNonce: number;
  maxOneSftPerPayment: boolean;
  marketplaceKey: string;

  constructor(init?: Partial<CreateAuctionRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(auctionArgs: CreateAuctionArgs) {
    return new CreateAuctionRequest({
      identifier: auctionArgs.identifier,
      quantity: auctionArgs.quantity,
      minBid: auctionArgs.minBid,
      maxBid: auctionArgs.maxBid,
      startDate: auctionArgs.startDate,
      deadline: auctionArgs.deadline,
      paymentToken: auctionArgs.paymentToken,
      paymentTokenNonce: auctionArgs.paymentTokenNonce,
      maxOneSftPerPayment: auctionArgs.maxOneSftPerPayment,
      marketplaceKey: auctionArgs.marketplaceKey,
    });
  }
}
