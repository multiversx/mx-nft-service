import { Injectable } from '@nestjs/common';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { ELRONDNFTSWAP_KEY } from 'src/utils/constants';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { ReindexAuctionClosedSummary } from '../models/marketplaces-reindex-events-summaries/AuctionClosedSummary';

@Injectable()
export class ReindexAuctionClosedHandler {
  constructor() {}

  handle(marketplaceReindexState: MarketplaceReindexState, input: ReindexAuctionClosedSummary): void {
    const auctionIndex =
      marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
        ? marketplaceReindexState.getAuctionIndexByAuctionId(input.auctionId)
        : marketplaceReindexState.getAuctionIndexByIdentifier(input.identifier);
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    if (auctionIndex === -1) {
      return;
    }

    marketplaceReindexState.updateAuctionStatus(auctionIndex, input.blockHash, AuctionStatusEnum.Closed, input.timestamp);

    marketplaceReindexState.setInactiveOrdersForAuction(auctionIndex, modifiedDate);
  }
}
