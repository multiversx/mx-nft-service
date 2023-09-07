import { BinaryUtils } from '@multiversx/sdk-nestjs';
import { Injectable } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { Token } from 'src/modules/usdPrice/Token.model';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { AuctionStartedSummary } from '../models/marketplaces-reindex-events-summaries/AuctionStartedSummary';

@Injectable()
export class ReindexAuctionStartedHandler {
  constructor() {}

  handle(input: AuctionStartedSummary, marketplaceReindexState: MarketplaceReindexState, paymentToken: Token, paymentNonce: number): void {
    const nonce = BinaryUtils.hexToNumber(input.nonce);
    const itemsCount = parseInt(input.itemsCount);
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
    const startTime = Number.isNaN(input.startTime) ? input.timestamp : input.startTime;
    const auction = new AuctionEntity({
      creationDate: modifiedDate,
      modifiedDate,
      id: marketplaceReindexState.auctions.length,
      marketplaceAuctionId: input.auctionId !== 0 ? input.auctionId : marketplaceReindexState.auctions.length + 1,
      identifier: input.identifier,
      collection: input.collection,
      nonce: nonce,
      nrAuctionedTokens: itemsCount,
      status: AuctionStatusEnum.Running,
      type: input.auctionType,
      paymentToken: paymentToken.identifier,
      paymentNonce,
      ownerAddress: input.sender,
      minBid: input.minBid,
      maxBid: input.maxBid !== 'NaN' ? input.maxBid : '0',
      minBidDenominated: BigNumberUtils.denominateAmount(input.minBid, paymentToken.decimals),
      maxBidDenominated: BigNumberUtils.denominateAmount(input.maxBid !== 'NaN' ? input.maxBid : '0', paymentToken.decimals),
      minBidDiff: input.minBidDiff ?? '0',
      startDate: startTime,
      endDate: input.endTime > 0 ? input.endTime : 0,
      tags: '',
      blockHash: input.blockHash ?? '',
      marketplaceKey: marketplaceReindexState.marketplace.key,
    });

    marketplaceReindexState.auctions.push(auction);
  }
}
