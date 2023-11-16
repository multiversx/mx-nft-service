import { Injectable } from '@nestjs/common';
import { constants } from 'src/config';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { AuctionPriceUpdatedSummary } from '../models/marketplaces-reindex-events-summaries/AuctionPriceUpdated';

@Injectable()
export class ReindexAuctionPriceUpdatedHandler {
  constructor() {}

  handle(marketplaceReindexState: MarketplaceReindexState, input: AuctionPriceUpdatedSummary, decimals: number): void {
    const auction = marketplaceReindexState.auctionMap.get(input.auctionId);

    if (!auction) {
      return;
    }

    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    auction.blockHash = auction.blockHash ?? input.blockHash;
    auction.modifiedDate = modifiedDate;
    auction.minBid = input.minBid;
    auction.minBidDenominated = Math.min(BigNumberUtils.denominateAmount(input.minBid, decimals), constants.dbMaxDenominatedValue);

    if (input.maxBid) {
      auction.maxBid = input.maxBid;
      auction.maxBidDenominated = Math.min(BigNumberUtils.denominateAmount(input.maxBid, decimals), constants.dbMaxDenominatedValue);
    } else {
      auction.maxBid = auction.minBid;
      auction.maxBidDenominated = auction.minBidDenominated;
    }

    if (input.paymentToken) {
      auction.paymentToken = input.paymentToken;
    }

    if (input.itemsCount) {
      auction.nrAuctionedTokens = input.itemsCount;
    }
  }
}
