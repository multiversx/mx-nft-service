import { MarketplaceEventsIndexingArgs } from './MarketplaceEventsIndexingArgs';

export class MarketplaceEventsIndexingRequest {
  marketplaceAddress: string;
  beforeTimestamp?: number;
  afterTimestamp?: number;
  stopIfDuplicates?: boolean;
  marketplaceLastIndexTimestamp?: number;
  txTimestampDelimiter?: number;

  static fromMarketplaceEventsIndexingArgs(input: MarketplaceEventsIndexingArgs): MarketplaceEventsIndexingRequest {
    return new MarketplaceEventsIndexingRequest({
      marketplaceAddress: input.marketplaceAddress,
      beforeTimestamp: input.beforeTimestamp,
      afterTimestamp: input.afterTimestamp,
      stopIfDuplicates: input.stopIfDuplicates,
      marketplaceLastIndexTimestamp: input.marketplaceLastIndexTimestamp,
    });
  }

  constructor(init?: Partial<MarketplaceEventsIndexingRequest>) {
    Object.assign(this, init);
  }
}
