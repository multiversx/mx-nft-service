import { DateUtils } from 'src/utils/date-utils';
import { CreateOfferArgs } from './CreateOfferArgs';

export class CreateOfferRequest {
  identifier: string;
  paymentAmount: string;
  startDate: string;
  deadline: string;
  paymentToken: string;
  paymentTokenNonce: number;
  quantity: string;
  auctionId: number;
  marketplaceKey: string;

  constructor(init?: Partial<CreateOfferRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: CreateOfferArgs) {
    return new CreateOfferRequest({
      identifier: args.identifier,
      startDate: DateUtils.getCurrentTimestamp().toString(),
      deadline: args.deadline,
      paymentToken: args.paymentToken,
      paymentTokenNonce: args.paymentTokenNonce,
      paymentAmount: args.paymentAmount,
      quantity: args.quantity,
      auctionId: args.auctionId,
      marketplaceKey: args.marketplaceKey,
    });
  }
}
