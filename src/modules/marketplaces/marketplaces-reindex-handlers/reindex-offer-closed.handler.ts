import { Injectable } from '@nestjs/common';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { OfferClosedSummary } from '../models/marketplaces-reindex-events-summaries/OfferClosedSummary';

@Injectable()
export class ReindexOfferClosedHandler {
  constructor() {}

  handle(marketplaceReindexState: MarketplaceReindexState, input: OfferClosedSummary): void {
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
    const offerIndex = marketplaceReindexState.getOfferIndexByOfferId(input.offerId);
    if (offerIndex === -1) {
      return;
    }
    marketplaceReindexState.offers[offerIndex].status = OfferStatusEnum.Closed;
    marketplaceReindexState.offers[offerIndex].modifiedDate = modifiedDate;
  }
}
