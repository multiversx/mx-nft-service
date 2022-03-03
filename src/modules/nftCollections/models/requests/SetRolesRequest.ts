import { SetNftRolesArgs } from '../SetNftRolesArgs';

export class SetNftRolesRequest {
  collection: string;
  addressToTransfer: string;
  roles: string[];
  constructor(init?: Partial<SetNftRolesRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(setRolesRequest: SetNftRolesArgs) {
    return new SetNftRolesRequest({
      collection: setRolesRequest.collection,
      addressToTransfer: setRolesRequest.addressToTransfer,
      roles: setRolesRequest.roles,
    });
  }
}
