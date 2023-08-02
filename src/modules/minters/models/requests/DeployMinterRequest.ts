import { DeployMinterArgs } from '../DeployMinterArgs';

export class DeployMinterRequest {
  collectionCategory: string;
  royaltiesClaimAddress: string;
  mintClaimAddress: string;
  ownerAddress: string;
  maxNftsPerTransaction: number;
  constructor(init?: Partial<DeployMinterRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: DeployMinterArgs) {
    return new DeployMinterRequest({
      collectionCategory: args.collectionCategory,
      royaltiesClaimAddress: args.royaltiesClaimAddress,
      mintClaimAddress: args.mintClaimAddress,
      maxNftsPerTransaction: args.maxNftsPerTransaction,
      ownerAddress: args.ownerAddress,
    });
  }
}
