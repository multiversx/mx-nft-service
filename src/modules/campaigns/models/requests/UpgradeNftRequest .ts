import { BuyRandomNftActionArgs, UpgradeNftArgs } from '..';

export class UpgradeNftRequest {
  campaignId: string;
  tier: string;
  minterAddress: string;
  identifier: string;
  constructor(init?: Partial<UpgradeNftRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: UpgradeNftArgs) {
    return new UpgradeNftRequest({
      campaignId: args.campaignId,
      tier: args.tier,
      minterAddress: args.minterAddress,
      identifier: args.identifier,
    });
  }
}
