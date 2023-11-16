import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { Injectable } from '@nestjs/common';
import { constants } from 'src/config';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { AuctionUpdatedSummary } from '../models/marketplaces-reindex-events-summaries/AuctionUpdatedSummary';

@Injectable()
export class ReindexAuctionUpdatedHandler {
  constructor() {}

  handle(marketplaceReindexState: MarketplaceReindexState, input: AuctionUpdatedSummary, decimals: number): void {
    const auction = marketplaceReindexState.auctionMap.get(input.auctionId);
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    if (!auction) {
      return;
    }

    auction.blockHash = auction.blockHash ?? input.blockHash;
    auction.modifiedDate = modifiedDate;

    auction.minBid = input.minBid;
    auction.minBidDenominated = Math.min(BigNumberUtils.denominateAmount(input.minBid, decimals), constants.dbMaxDenominatedValue);
    auction.maxBid = input.minBid;
    auction.maxBidDenominated = Math.min(auction.minBidDenominated, constants.dbMaxDenominatedValue);

    if (input.paymentToken) {
      auction.paymentToken = input.paymentToken;
      auction.paymentNonce = BinaryUtils.hexToNumber(input.paymentNonce);
    }

    if (input.deadline > 0) {
      auction.endDate = input.deadline;
    }
  }
}
