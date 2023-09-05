import { mxConfig } from 'src/config';
import { IssueCampaignArgs as IssueCampaignArgs } from '../IssueCampaignArgs';

export class IssueCampaignRequest {
  collectionIpfsHash: string;
  campaignId: string;
  mediaTypes: string;
  royalties: string;
  mintStartTime: number;
  mintEndTime: number;
  whitelistEndTime: number;
  mintPriceToken: string = mxConfig.egld;
  collectionName: string;
  collectionTicker: string;
  tags: string[];
  tiers: TierRequest[];
  minterAddress: string;
  ownerAddress: string;

  constructor(init?: Partial<IssueCampaignRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: IssueCampaignArgs) {
    return new IssueCampaignRequest({
      collectionIpfsHash: args.collectionIpfsHash,
      campaignId: args.campaignId,
      mediaTypes: args.mediaTypes,
      royalties: args.royalties,
      mintPriceToken: args.mintPriceToken,
      mintStartTime: args.mintStartTime,
      mintEndTime: args.mintEndTime,
      collectionName: args.collectionName,
      collectionTicker: args.collectionTicker,
      whitelistEndTime: args.whitelistEndTime,
      tags: args.tags,
      minterAddress: args.minterAddress,
      ownerAddress: args.ownerAddress,
      tiers: args.tiers.map(
        (t) =>
          new TierRequest({
            totalNfts: t.totalNfts,
            mintPriceAmount: t.mintPriceAmount,
            tierName: t.tierName,
          }),
      ),
    });
  }
}

export class TierRequest {
  tierName: string;
  totalNfts: number;
  mintPriceAmount: string;

  constructor(init?: Partial<TierRequest>) {
    Object.assign(this, init);
  }
}
