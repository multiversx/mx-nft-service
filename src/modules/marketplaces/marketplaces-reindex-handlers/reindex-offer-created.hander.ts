import { Injectable } from '@nestjs/common';
import { constants } from 'src/config';
import { OfferEntity } from 'src/db/offers';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { OfferCreatedSummary } from '../models/marketplaces-reindex-events-summaries/OfferCreatedSummary';

@Injectable()
export class ReindexOfferCreatedHandler {
  constructor() {}

  handle(marketplaceReindexState: MarketplaceReindexState, input: OfferCreatedSummary, decimals: number): void {
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
    const priceAmountDenominated = BigNumberUtils.denominateAmount(input.price, decimals);
    const offer = new OfferEntity({
      id: marketplaceReindexState.offers.length,
      creationDate: modifiedDate,
      modifiedDate,
      marketplaceOfferId: input.offerId,
      blockHash: input.blockHash,
      collection: input.collection,
      identifier: input.identifier,
      priceToken: input.paymentToken,
      priceNonce: input.paymentNonce,
      priceAmount: input.price,
      priceAmountDenominated: Math.min(priceAmountDenominated, constants.dbMaxDenominatedValue),
      ownerAddress: input.address,
      endDate: Math.min(input.endTime, constants.dbMaxTimestamp),
      boughtTokensNo: input.itemsCount,
      marketplaceKey: marketplaceReindexState.marketplace.key,
      status: OfferStatusEnum.Active,
    });
    marketplaceReindexState.offers.push(offer);
  }
}
