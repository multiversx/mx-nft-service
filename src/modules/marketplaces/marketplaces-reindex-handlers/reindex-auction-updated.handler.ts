import { Injectable } from '@nestjs/common';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { AuctionUpdatedSummary } from '../models/marketplaces-reindex-events-summaries/AuctionUpdatedSummary';

@Injectable()
export class ReindexAuctionUpdatedHandler {
  constructor() {}

  handle(
    marketplaceReindexState: MarketplaceReindexState,
    input: AuctionUpdatedSummary,
    decimals: number,
  ): void {
    throw new Error('Not implemented yet');
  }
}
