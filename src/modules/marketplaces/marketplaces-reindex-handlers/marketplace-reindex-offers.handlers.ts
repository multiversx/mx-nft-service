import { OfferEntity } from 'src/db/offers';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';
import { Marketplace } from '../models';
import { MarketplaceEventLogInput } from '../models/MarketplaceEventLogInput';

export function handleMarketplaceReindexCreatedOfferEvent(
  input: MarketplaceEventLogInput,
  marketplace: Marketplace,
  offersState: OfferEntity[],
  decimals: number,
): void {
  const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
  const offer = new OfferEntity({
    id: offersState.length,
    creationDate: modifiedDate,
    modifiedDate,
    marketplaceOfferId: parseInt(input.offerId),
    blockHash: input.blockHash,
    collection: input.collection,
    identifier: input.identifier,
    priceToken: input.paymentToken,
    priceNonce: input.paymentNonce,
    priceAmount: input.price,
    priceAmountDenominated: BigNumberUtils.denominateAmount(
      input.price,
      decimals,
    ),
    ownerAddress: input.address,
    endDate: input.endTime,
    boughtTokensNo: input.itemsCount,
    marketplaceKey: marketplace.key,
    status: OfferStatusEnum.Active,
  });
  offersState.push(offer);
}

export function handleMarketplaceReindexAcceptedOfferEvent(
  input: MarketplaceEventLogInput,
  offersState: OfferEntity[],
): void {
  const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
  const offerIndex = getOfferIndex(offersState, input);
  offersState[offerIndex].status = OfferStatusEnum.Accepted;
  offersState[offerIndex].modifiedDate = modifiedDate;
}

export function handleMarketplaceReindexClosedOfferEvent(
  input: MarketplaceEventLogInput,
  offersState: OfferEntity[],
): void {
  const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
  const offerIndex = getOfferIndex(offersState, input);
  offersState[offerIndex].status = OfferStatusEnum.Closed;
  offersState[offerIndex].modifiedDate = modifiedDate;
}

export function handleMarketplaceExpiredOffers(
  offersState: OfferEntity[],
  currentTimestamp: number,
): void {
  for (let i = 0; i < offersState.length; i++) {
    if (
      offersState[i].status === OfferStatusEnum.Active &&
      offersState[i].endDate < currentTimestamp
    ) {
      offersState[i].status = OfferStatusEnum.Expired;
    }
  }
}

function getOfferIndex(
  offersState: OfferEntity[],
  input: MarketplaceEventLogInput,
): number {
  const offerId = parseInt(input.offerId);
  return offersState.findIndex((o) => o.marketplaceOfferId === offerId);
}
