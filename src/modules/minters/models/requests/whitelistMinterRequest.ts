import { WhitelistMinterArgs } from '../AddMinterArgs';

export class WhitelistMinterRequest {
  address: string;
  name: string;
  description: string;
  royaltiesClaimAddress: string;
  mintClaimAddress: string;
  maxNftsPerTransaction: number;
  adminAddress: string;
  constructor(init?: Partial<WhitelistMinterRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: WhitelistMinterArgs) {
    return new WhitelistMinterRequest({
      address: args.address,
      name: args.name,
      description: args.description,
      royaltiesClaimAddress: args.royaltiesClaimAddress,
      mintClaimAddress: args.mintClaimAddress,
      adminAddress: args.adminAddress,
      maxNftsPerTransaction: args.maxNftsPerTransaction,
    });
  }
}
