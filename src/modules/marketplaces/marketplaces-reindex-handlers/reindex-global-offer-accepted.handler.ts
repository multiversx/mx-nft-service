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
    const auctionIndex = marketplaceReindexState.getAuctionIndexByAuctionId(input.auctionId);

    if (auctionIndex === -1) {
      return;
    }

    marketplaceReindexState.auctions[auctionIndex].status = AuctionStatusEnum.Closed;
    marketplaceReindexState.auctions[auctionIndex].modifiedDate = modifiedDate;
  }
}
