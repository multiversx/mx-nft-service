import { MarketplaceEventsIndexingArgs } from './MarketplaceEventsIndexingArgs';

export class MarketplaceEventsIndexingInput {
  marketplaceAddress: string;
  beforeTimestamp?: number;
  afterTimestamp?: number;
  stopIfDuplicates?: boolean;
  marketplaceLastIndexTimestamp?: number;

  static fromMarketplaceEventsIndexingArgs(
    input: MarketplaceEventsIndexingArgs,
  ): MarketplaceEventsIndexingInput {
    return new MarketplaceEventsIndexingInput({
      ...input,
    });
  }

  constructor(init?: Partial<MarketplaceEventsIndexingInput>) {
    Object.assign(this, init);
  }
}
