import { TransferNftArgs } from '../TransferNftArgs';

export class TransferNftRequest {
  identifier: string;
  quantity: string = '1';
  destinationAddress: string;

  constructor(init?: Partial<TransferNftRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(nftArgs: TransferNftArgs) {
    return new TransferNftRequest({
      identifier: nftArgs.identifier,
      quantity: nftArgs.quantity,
      destinationAddress: nftArgs.destinationAddress,
    });
  }
}
