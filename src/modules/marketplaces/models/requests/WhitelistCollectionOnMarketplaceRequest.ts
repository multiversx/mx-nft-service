import { RemoveWhitelistCollectionArgs, WhitelistCollectionArgs } from '../WhitelistCollectionArgs';

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

export class RemoveWhitelistCollectionRequest {
  collection: string;
  marketplaceKey: string;
  constructor(init?: Partial<RemoveWhitelistCollectionRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: RemoveWhitelistCollectionArgs) {
    return new RemoveWhitelistCollectionRequest({
      collection: args.collection,
      marketplaceKey: args.marketplaceKey,
    });
  }
}
