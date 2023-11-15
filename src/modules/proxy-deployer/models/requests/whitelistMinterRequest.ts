import { WhitelistMinterArgs } from '../AddMinterArgs';

export class WhitelistMinterRequest {
  address: string;
  adminAddress: string;
  constructor(init?: Partial<WhitelistMinterRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: WhitelistMinterArgs) {
    return new WhitelistMinterRequest({
      address: args.address,
      adminAddress: args.adminAddress,
    });
  }
}
