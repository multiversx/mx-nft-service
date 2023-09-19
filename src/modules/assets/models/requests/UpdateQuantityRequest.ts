import { HandleQuantityArgs } from '../HandleQuantityArgs';

export class UpdateQuantityRequest {
  updateQuantityRoleAddress: string;
  identifier: string;
  quantity: string;
  functionName: 'ESDTNFTAddQuantity' | 'ESDTNFTBurn';
  constructor(init?: Partial<UpdateQuantityRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(updateQuantityArgs: HandleQuantityArgs, functionName: 'ESDTNFTAddQuantity' | 'ESDTNFTBurn') {
    return new UpdateQuantityRequest({
      updateQuantityRoleAddress: updateQuantityArgs.addOrBurnRoleAddress,
      identifier: updateQuantityArgs.identifier,
      quantity: updateQuantityArgs.quantity,
      functionName: functionName,
    });
  }
}
