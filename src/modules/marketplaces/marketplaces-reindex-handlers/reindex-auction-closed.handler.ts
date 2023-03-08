import { Injectable } from '@nestjs/common';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { ReindexAuctionClosedSummary } from '../models/marketplaces-reindex-events-summaries/AuctionClosedSummary';

@Injectable()
export class ReindexAuctionClosedHandler {
  constructor() {}

  handle(
    marketplaceReindexState: MarketplaceReindexState,
    input: ReindexAuctionClosedSummary,
  ): void {
    const auctionIndex = this.getAuctionIndex(marketplaceReindexState, input);
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    if (auctionIndex === -1) {
      return;
    }

    marketplaceReindexState.auctions[auctionIndex].status =
      AuctionStatusEnum.Closed;
    marketplaceReindexState.auctions[auctionIndex].blockHash =
      marketplaceReindexState.auctions[auctionIndex].blockHash ??
      input.blockHash;
    marketplaceReindexState.auctions[auctionIndex].modifiedDate = modifiedDate;

    marketplaceReindexState.setInactiveOrdersForAuction(
      marketplaceReindexState.auctions[auctionIndex].id,
      modifiedDate,
    );
  }

  private getAuctionIndex(
    marketplaceReindexState: MarketplaceReindexState,
    input: ReindexAuctionClosedSummary,
  ): number {
    if (input.auctionId) {
      return marketplaceReindexState.getAuctionIndexByNonce(input.auctionId);
    }
    return marketplaceReindexState.getAuctionIndexByIdentifier(
      input.identifier,
    );
  }
}
