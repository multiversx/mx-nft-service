import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { constants } from 'src/config';
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
    let status = AuctionStatusEnum.Running;
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
    const startTime = Number.isNaN(input.startTime) ? input.timestamp : input.startTime;
    const endTime = input.endTime > 0 ? input.endTime : 0;
    const minBidDenominated = BigNumberUtils.denominateAmount(input.minBid, paymentToken.decimals);
    const maxBidDenominated = BigNumberUtils.denominateAmount(input.maxBid !== 'NaN' ? input.maxBid : '0', paymentToken.decimals);
    if (endTime > 0 && endTime <= DateUtils.getCurrentTimestamp()) {
      status = AuctionStatusEnum.Claimable;
    }

    const auction = new AuctionEntity({
      creationDate: modifiedDate,
      modifiedDate,
      marketplaceAuctionId: input.auctionId !== 0 ? input.auctionId : marketplaceReindexState.auctionMap.size + 1,
      identifier: input.identifier,
      collection: input.collection,
      nonce: nonce,
      nrAuctionedTokens: itemsCount,
      status: status,
      type: input.auctionType,
      paymentToken: paymentToken.identifier,
      paymentNonce,
      ownerAddress: input.sender,
      minBid: new BigNumber(input.minBid).toFixed(),
      maxBid: new BigNumber(input.maxBid !== 'NaN' ? input.maxBid : '0').toFixed(),
      minBidDenominated: Math.min(minBidDenominated, constants.dbMaxDenominatedValue),
      maxBidDenominated: Math.min(maxBidDenominated, constants.dbMaxDenominatedValue),
      minBidDiff: input.minBidDiff ?? '0',
      startDate: Math.min(startTime, constants.dbMaxTimestamp),
      endDate: Math.min(endTime, constants.dbMaxTimestamp),
      tags: '',
      blockHash: input.blockHash ?? '',
      marketplaceKey: marketplaceReindexState.marketplace.key,
    });

    marketplaceReindexState.auctionMap.set(auction.marketplaceAuctionId, auction);
  }
}
