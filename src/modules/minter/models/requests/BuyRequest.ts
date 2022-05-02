import { BuyRandomNftActionArgs } from '..';

export class BuyRequest {
  brandId: string;
  minterAddress: string;
  price: string;
  quantity: string;
  constructor(init?: Partial<BuyRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(buySftArgs: BuyRandomNftActionArgs) {
    return new BuyRequest({
      brandId: buySftArgs.brandId,
      minterAddress: buySftArgs.minterAddress,
      price: buySftArgs.price,
      quantity: buySftArgs.quantity,
    });
  }
}
