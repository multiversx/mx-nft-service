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
    const auction =
      marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
        ? marketplaceReindexState.auctionMap.get(input.auctionId)
        : marketplaceReindexState.auctionMap.get(input.auctionId); //de scris
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    if (!auction) {
      return;
    }

    marketplaceReindexState.updateAuctionStatus(auction, input.blockHash, AuctionStatusEnum.Closed, input.timestamp);

    marketplaceReindexState.setInactiveOrdersForAuction(auction, modifiedDate);
  }
}
