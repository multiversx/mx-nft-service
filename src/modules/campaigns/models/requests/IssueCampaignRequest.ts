import { MediaMimeTypeEnum } from 'src/modules/assets/models/MediaTypes.enum';
import { IssueCampaignArgs as IssueCampaignArgs } from '../IssueCampaignArgs';

export class IssueCampaignRequest {
  collectionIpfsHash: string;
  brandId: string;
  mediaTypes: MediaMimeTypeEnum;
  royalties: string;
  maxNfts: number;
  mintStartTime: number;
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
      brandId: args.brandId,
      mediaTypes: MediaMimeTypeEnum[args.mediaTypes],
      royalties: args.royalties,
      maxNfts: args.maxNfts,
      mintPriceAmount: args.mintPriceAmount,
      mintPriceToken: args.mintPriceToken,
      mintStartTime: args.mintStartTime,
      collectionName: args.collectionName,
      collectionTicker: args.collectionTicker,
      tags: args.tags,
      minterAddress: args.minterAddress,
    });
  }
}
