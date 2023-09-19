import { UpgradeNftArgs } from '..';

export class UpgradeNftRequest {
  campaignId: string;
  minterAddress: string;
  identifier: string;
  constructor(init?: Partial<UpgradeNftRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: UpgradeNftArgs) {
    return new UpgradeNftRequest({
      campaignId: args.campaignId,
      minterAddress: args.minterAddress,
      identifier: args.identifier,
    });
  }
}
