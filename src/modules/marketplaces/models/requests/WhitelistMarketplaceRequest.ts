import { WhitelistMarketplaceArgs } from '../WhitelistMarketplaceArgs';
import { mxConfig } from 'src/config';

export class WhitelistMarketplaceRequest {
  marketplaceName: string;
  marketplaceKey: string;
  marketplaceUrl: string;
  marketplaceScAddress: string = mxConfig.nftMarketplaceAddress;

  constructor(init?: Partial<WhitelistMarketplaceRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(args: WhitelistMarketplaceArgs) {
    return new WhitelistMarketplaceRequest({
      marketplaceName: args.marketplaceName,
      marketplaceKey: args.marketplaceKey,
      marketplaceUrl: args.marketplaceUrl,
      marketplaceScAddress: args.marketplaceScAddress,
    });
  }
}
