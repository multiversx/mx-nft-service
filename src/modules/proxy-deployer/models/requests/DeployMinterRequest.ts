import { DeployMinterArgs, UpgradeMinterArgs } from '../DeployMinterArgs';

export class DeployMinterRequest {
  royaltiesClaimAddress: string;
  mintClaimAddress: string;
  ownerAddress: string;
  maxNftsPerTransaction: number;
  constructor(init?: Partial<DeployMinterRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: DeployMinterArgs) {
    return new DeployMinterRequest({
      royaltiesClaimAddress: args.royaltiesClaimAddress,
      mintClaimAddress: args.mintClaimAddress,
      maxNftsPerTransaction: args.maxNftsPerTransaction,
      ownerAddress: args.ownerAddress,
    });
  }
}

export class UpgradeMinterRequest {
  minterAddress: string;

  constructor(init?: Partial<UpgradeMinterRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: UpgradeMinterArgs) {
    return new UpgradeMinterRequest({
      minterAddress: args.minterAddress,
    });
  }
}
