import { Injectable } from '@nestjs/common';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { AuctionPriceUpdatedSummary } from '../models/marketplaces-reindex-events-summaries/AuctionPriceUpdated';

@Injectable()
export class ReindexAuctionPriceUpdatedHandler {
  constructor() {}

  handle(
    marketplaceReindexState: MarketplaceReindexState,
    input: AuctionPriceUpdatedSummary,
    decimals: number,
  ): void {
    throw new Error('Not implemented yet');
  }
}
