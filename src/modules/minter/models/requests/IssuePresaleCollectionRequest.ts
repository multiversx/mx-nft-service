import { MediaMimeTypeEnum } from 'src/modules/assets/models/MediaTypes.enum';
import { IssuePresaleCollectionArgs } from '../IssuePresaleCollectionArgs';

export class IssuePresaleCollectionRequest {
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
  constructor(init?: Partial<IssuePresaleCollectionRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: IssuePresaleCollectionArgs) {
    return new IssuePresaleCollectionRequest({
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
    });
  }
}
