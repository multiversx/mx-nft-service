import { TransferNftCreateRoleArgs } from '..';

export class TransferNftCreateRoleRequest {
  collection: string;
  ownerAddress: string;
  addressToTransferList: string[];
  constructor(init?: Partial<TransferNftCreateRoleRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(setRolesRequest: TransferNftCreateRoleArgs) {
    return new TransferNftCreateRoleRequest({
      collection: setRolesRequest.collection,
      addressToTransferList: setRolesRequest.addressToTransferList,
      ownerAddress: setRolesRequest.ownerAddress,
    });
  }
}
