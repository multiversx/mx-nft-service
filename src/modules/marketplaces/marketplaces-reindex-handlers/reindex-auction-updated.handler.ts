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
    const auctionIndex = marketplaceReindexState.getAuctionIndexByAuctionId(input.auctionId);
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    if (auctionIndex === -1) {
      return;
    }

    marketplaceReindexState.auctions[auctionIndex].blockHash = marketplaceReindexState.auctions[auctionIndex].blockHash ?? input.blockHash;
    marketplaceReindexState.auctions[auctionIndex].modifiedDate = modifiedDate;

    marketplaceReindexState.auctions[auctionIndex].minBid = input.minBid;
    marketplaceReindexState.auctions[auctionIndex].minBidDenominated = Math.min(
      BigNumberUtils.denominateAmount(input.minBid, decimals),
      constants.dbMaxDenominatedValue,
    );
    marketplaceReindexState.auctions[auctionIndex].maxBid = input.minBid;
    marketplaceReindexState.auctions[auctionIndex].maxBidDenominated = Math.min(
      marketplaceReindexState.auctions[auctionIndex].minBidDenominated,
      constants.dbMaxDenominatedValue,
    );

    if (input.paymentToken) {
      marketplaceReindexState.auctions[auctionIndex].paymentToken = input.paymentToken;
      marketplaceReindexState.auctions[auctionIndex].paymentNonce = BinaryUtils.hexToNumber(input.paymentNonce);
    }

    if (input.deadline > 0) {
      marketplaceReindexState.auctions[auctionIndex].endDate = input.deadline;
    }
  }
}
