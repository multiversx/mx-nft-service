import { BuyRandomNftActionArgs, UpgradeNftArgs } from '..';

export class UpgradeNftRequest {
  campaignId: string;
  tier: string;
  minterAddress: string;
  constructor(init?: Partial<UpgradeNftRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(buySftArgs: UpgradeNftArgs) {
    return new UpgradeNftRequest({
      campaignId: buySftArgs.campaignId,
      tier: buySftArgs.tier,
      minterAddress: buySftArgs.minterAddress,
    });
  }
}
