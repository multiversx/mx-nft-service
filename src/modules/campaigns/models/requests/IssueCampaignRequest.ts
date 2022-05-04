import { IssueCampaignArgs as IssueCampaignArgs } from '../IssueCampaignArgs';

export class IssueCampaignRequest {
  collectionIpfsHash: string;
  campaignId: string;
  mediaTypes: string;
  royalties: string;
  maxNfts: number;
  mintStartTime: number;
  mintEndTime: number;
  mintPriceToken: string = 'EGLD';
  mintPriceAmount: string;
  collectionName: string;
  collectionTicker: string;
  tags: string[];
  minterAddress: string;

  constructor(init?: Partial<IssueCampaignRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: IssueCampaignArgs) {
    return new IssueCampaignRequest({
      collectionIpfsHash: args.collectionIpfsHash,
      campaignId: args.campaignId,
      mediaTypes: args.mediaTypes,
      royalties: args.royalties,
      maxNfts: args.maxNfts,
      mintPriceAmount: args.mintPriceAmount,
      mintPriceToken: args.mintPriceToken,
      mintStartTime: args.mintStartTime,
      mintEndTime: args.mintEndTime,
      collectionName: args.collectionName,
      collectionTicker: args.collectionTicker,
      tags: args.tags,
      minterAddress: args.minterAddress,
    });
  }
}
