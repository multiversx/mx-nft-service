import { DateUtils } from 'src/utils/date-utils';
import { CreateOfferArgs } from './CreateOfferArgs';

export class CreateOfferRequest {
  identifier: string;
  paymentAmount: string;
  startDate: string;
  deadline: string;
  paymentToken: string;
  paymentTokenNonce: number;

  constructor(init?: Partial<CreateOfferRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(auctionArgs: CreateOfferArgs) {
    return new CreateOfferRequest({
      identifier: auctionArgs.identifier,
      startDate: DateUtils.getCurrentTimestamp().toString(),
      deadline: auctionArgs.deadline,
      paymentToken: auctionArgs.paymentToken,
      paymentTokenNonce: auctionArgs.paymentTokenNonce,
      paymentAmount: auctionArgs.paymentAmount,
    });
  }
}
