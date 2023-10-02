import { WhitelistCollectionArgs } from '../WhitelistCollectionArgs';

export class WhitelistCollectionRequest {
  collection: string;
  marketplaceKey: string;
  constructor(init?: Partial<WhitelistCollectionRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: WhitelistCollectionArgs) {
    return new WhitelistCollectionRequest({
      collection: args.collection,
      marketplaceKey: args.marketplaceKey,
    });
  }
}
