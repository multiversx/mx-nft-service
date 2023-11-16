import { Injectable } from '@nestjs/common';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { GlobalOfferAcceptedSummary } from '../models/marketplaces-reindex-events-summaries/GloballyOfferAcceptedSummary';

@Injectable()
export class ReindexGlobalOfferAcceptedHandler {
  constructor() {}

  handle(marketplaceReindexState: MarketplaceReindexState, input: GlobalOfferAcceptedSummary): void {
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
    const auction = marketplaceReindexState.auctionMap.get(input.auctionId);

    if (!auction) {
      return;
    }

    auction.status = AuctionStatusEnum.Closed;
    auction.modifiedDate = modifiedDate;
  }
}
