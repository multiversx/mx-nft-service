import { BuyRandomNftActionArgs } from '..';

export class BuyRequest {
  campaignId: string;
  tier: string;
  minterAddress: string;
  price: string;
  quantity: string;
  constructor(init?: Partial<BuyRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(buySftArgs: BuyRandomNftActionArgs) {
    return new BuyRequest({
      campaignId: buySftArgs.campaignId,
      tier: buySftArgs.tier,
      minterAddress: buySftArgs.minterAddress,
      price: buySftArgs.price,
      quantity: buySftArgs.quantity,
    });
  }
}
