import { Injectable } from '@nestjs/common';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';
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
    const auctionIndex = marketplaceReindexState.getAuctionIndexByNonce(
      input.auctionId,
    );
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
    if (auctionIndex === -1) {
      return;
    }

    marketplaceReindexState.auctions[auctionIndex].blockHash =
      marketplaceReindexState.auctions[auctionIndex].blockHash ??
      input.blockHash;
    marketplaceReindexState.auctions[auctionIndex].modifiedDate = modifiedDate;

    marketplaceReindexState.auctions[auctionIndex].minBid = input.minBid;
    marketplaceReindexState.auctions[auctionIndex].minBidDenominated =
      BigNumberUtils.denominateAmount(input.minBid, decimals);

    if (input.maxBid) {
      marketplaceReindexState.auctions[auctionIndex].maxBid = input.maxBid;
      marketplaceReindexState.auctions[auctionIndex].maxBidDenominated =
        BigNumberUtils.denominateAmount(input.maxBid, decimals);
    } else {
      marketplaceReindexState.auctions[auctionIndex].maxBid = input.minBid;
      marketplaceReindexState.auctions[auctionIndex].maxBidDenominated =
        marketplaceReindexState.auctions[auctionIndex].minBidDenominated;
    }

    if (input.paymentToken) {
      marketplaceReindexState.auctions[auctionIndex].paymentToken =
        input.paymentToken;
    }

    if (input.itemsCount) {
      marketplaceReindexState.auctions[auctionIndex].nrAuctionedTokens =
        input.itemsCount;
    }
  }
}
