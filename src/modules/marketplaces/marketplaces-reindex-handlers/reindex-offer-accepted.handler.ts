import { Injectable } from '@nestjs/common';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { ELRONDNFTSWAP_KEY } from 'src/utils/constants';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { OfferAcceptedSummary } from '../models/marketplaces-reindex-events-summaries/OfferAcceptedSummary';

@Injectable()
export class ReindexOfferAcceptedHandler {
  constructor() {}

  handle(marketplaceReindexState: MarketplaceReindexState, input: OfferAcceptedSummary): void {
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
    const offerIndex = marketplaceReindexState.getOfferIndexByOfferId(input.offerId);
    const auctionIndex =
      marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
        ? marketplaceReindexState.getAuctionIndexByAuctionId(input.auctionId)
        : marketplaceReindexState.getAuctionIndexByIdentifier(input.identifier);

    if (offerIndex !== -1) {
      marketplaceReindexState.offers[offerIndex].status = OfferStatusEnum.Accepted;
      marketplaceReindexState.offers[offerIndex].modifiedDate = modifiedDate;
      return;
    }

    if (auctionIndex !== -1) {
      marketplaceReindexState.auctions[auctionIndex].status = AuctionStatusEnum.Closed;
      marketplaceReindexState.auctions[auctionIndex].modifiedDate = modifiedDate;
    }
  }
}
