import { Injectable } from '@nestjs/common';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { GlobalOfferAcceptedSummary } from '../models/marketplaces-reindex-events-summaries/GloballyOfferAcceptedSummary';

@Injectable()
export class ReindexGlobalOfferAcceptedHandler {
  constructor() {}

  handle(
    marketplaceReindexState: MarketplaceReindexState,
    input: GlobalOfferAcceptedSummary,
  ): void {
    throw new Error('Not implemented yet');
  }
}
