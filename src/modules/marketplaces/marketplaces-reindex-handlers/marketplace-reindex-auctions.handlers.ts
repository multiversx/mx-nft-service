import { BinaryUtils } from '@elrondnetwork/erdnest';
import BigNumber from 'bignumber.js';
import { AuctionEntity } from 'src/db/auctions';
import { OrderEntity } from 'src/db/orders';
import { Asset } from 'src/modules/assets/models';
import {
  AuctionStatusEnum,
  AuctionTypeEnum,
} from 'src/modules/auctions/models';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';
import { Marketplace } from '../models';
import { MarketplaceEventLogInput } from '../models/MarketplaceEventLogInput';

export function handleMarketplaceReindexStartedAuctionEvent(
  input: MarketplaceEventLogInput,
  marketplace: Marketplace,
  auctionsState: AuctionEntity[],
  paymentTokenIdentifier: string,
  paymentNonce: number,
  decimals: number,
  asset: Asset,
): void {
  const auctionId = BinaryUtils.hexToNumber(input.auctionId);
  const nonce = BinaryUtils.hexToNumber(input.nonce);
  const itemsCount = parseInt(input.itemsCount);
  const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
  const auction = new AuctionEntity({
    creationDate: modifiedDate,
    modifiedDate,
    id: auctionsState.length,
    marketplaceAuctionId: auctionId,
    identifier: input.identifier,
    collection: input.collection,
    nonce: nonce,
    nrAuctionedTokens: itemsCount,
    status: AuctionStatusEnum.Running,
    type: input.auctionType,
    paymentToken: paymentTokenIdentifier,
    paymentNonce,
    ownerAddress: input.sender,
    minBid: input.minBid,
    maxBid: input.maxBid !== 'NaN' ? input.maxBid : '0',
    minBidDenominated: BigNumberUtils.denominateAmount(input.minBid, decimals),
    maxBidDenominated: BigNumberUtils.denominateAmount(
      input.maxBid !== 'NaN' ? input.maxBid : '0',
      decimals,
    ),
    minBidDiff: input.minBidDiff ?? '0',
    startDate: input.startTime,
    endDate: input.endTime,
    tags: asset.tags?.join(',') ?? '',
    blockHash: input.blockHash ?? '',
    marketplaceKey: marketplace.key,
  });
  auctionsState.push(auction);
}

export function handleMarketplaceReindexBoughtAuctionEvent(
  input: MarketplaceEventLogInput,
  marketplace: Marketplace,
  auctionsState: AuctionEntity[],
  ordersState: OrderEntity[],
  paymentTokenIdentifier: string,
  paymentNonce: number,
  decimals: number,
): void {
  const auctionIndex = getAuctionIndex(auctionsState, input);
  const itemsCount = parseInt(input.itemsCount);
  const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

  setInactiveOrdersForAuction(
    ordersState,
    auctionsState[auctionIndex].id,
    modifiedDate,
  );

  const order = new OrderEntity({
    id: ordersState.length,
    creationDate: modifiedDate,
    modifiedDate,
    auctionId: auctionsState[auctionIndex].id,
    ownerAddress: input.address,
    priceToken: paymentTokenIdentifier,
    priceNonce: paymentNonce,
    priceAmount: input.price,
    priceAmountDenominated: BigNumberUtils.denominateAmount(
      input.price,
      decimals,
    ),
    blockHash: input.blockHash ?? '',
    marketplaceKey: marketplace.key,
    boughtTokensNo:
      auctionsState[auctionIndex].type === AuctionTypeEnum.Nft
        ? null
        : itemsCount.toString(),
    status: OrderStatusEnum.Bought,
  });
  ordersState.push(order);

  const totalBought = getTotalBoughtTokensForAuction(
    auctionsState[auctionIndex].id,
    ordersState,
  );

  if (auctionsState[auctionIndex].nrAuctionedTokens === totalBought) {
    auctionsState[auctionIndex].status = AuctionStatusEnum.Ended;
    auctionsState[auctionIndex].modifiedDate = modifiedDate;
    auctionsState[auctionIndex].blockHash =
      auctionsState[auctionIndex].blockHash ?? input.blockHash;
  }
}

export function handleMarketplaceReindexEndedAuctionEvent(
  input: MarketplaceEventLogInput,
  auctionsState: AuctionEntity[],
  ordersState: OrderEntity[],
): void {
  const auctionIndex = getAuctionIndex(auctionsState, input);
  const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

  auctionsState[auctionIndex].status = AuctionStatusEnum.Ended;
  auctionsState[auctionIndex].blockHash =
    auctionsState[auctionIndex].blockHash ?? input.blockHash;
  auctionsState[auctionIndex].modifiedDate = modifiedDate;

  const winnerOrderId = handleChooseWinnerOrderAndReturnId(
    ordersState,
    auctionsState[auctionIndex],
    OrderStatusEnum.Bought,
  );

  setInactiveOrdersForAuction(
    ordersState,
    auctionsState[auctionIndex].id,
    modifiedDate,
    winnerOrderId,
  );
}

export function handleMarketplaceReindexClosedAuctionEvent(
  input: MarketplaceEventLogInput,
  auctionsState: AuctionEntity[],
  ordersState: OrderEntity[],
): void {
  const auctionIndex = getAuctionIndex(auctionsState, input);
  const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

  auctionsState[auctionIndex].status = AuctionStatusEnum.Closed;
  auctionsState[auctionIndex].blockHash =
    auctionsState[auctionIndex].blockHash ?? input.blockHash;
  auctionsState[auctionIndex].modifiedDate = modifiedDate;

  setInactiveOrdersForAuction(
    ordersState,
    auctionsState[auctionIndex].id,
    modifiedDate,
  );
}

export function handleMarketplaceReindexAuctionBidEvent(
  input: MarketplaceEventLogInput,
  marketplace: Marketplace,
  auctionsState: AuctionEntity[],
  ordersState: OrderEntity[],
  paymentTokenIdentifier: string,
  paymentNonce: number,
  decimals: number,
): void {
  const auctionIndex = getAuctionIndex(auctionsState, input);
  const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
  const itemsCount = parseInt(input.itemsCount);

  setInactiveOrdersForAuction(
    ordersState,
    auctionsState[auctionIndex].id,
    modifiedDate,
  );

  let order = new OrderEntity({
    id: ordersState.length,
    creationDate: modifiedDate,
    modifiedDate,
    auctionId: auctionsState[auctionIndex].id,
    status: OrderStatusEnum.Active,
    ownerAddress: input.address,
    priceToken: paymentTokenIdentifier,
    priceNonce: paymentNonce,
    priceAmount: input.price,
    priceAmountDenominated: BigNumberUtils.denominateAmount(
      input.price,
      decimals,
    ),
    blockHash: input.blockHash ?? '',
    marketplaceKey: marketplace.key,
    boughtTokensNo:
      auctionsState[auctionIndex].type === AuctionTypeEnum.Nft
        ? null
        : itemsCount.toString(),
  });

  if (order.priceAmount === auctionsState[auctionIndex].maxBid) {
    order.status = OrderStatusEnum.Bought;
    auctionsState[auctionIndex].status = AuctionStatusEnum.Ended;
  }

  ordersState.push(order);
}

export function getAuctionIndex(
  auctionsState: AuctionEntity[],
  input: MarketplaceEventLogInput,
): number {
  const auctionId = BinaryUtils.hexToNumber(input.auctionId);
  return auctionsState.findIndex((a) => a.marketplaceAuctionId === auctionId);
}

function getTotalBoughtTokensForAuction(
  auctionId: number,
  orders: OrderEntity[],
): number {
  let totalBought = 0;
  orders
    .filter(
      (o) => o.auctionId === auctionId && o.status === OrderStatusEnum.Bought,
    )
    .forEach((o) => {
      totalBought += Number.isInteger(o.boughtTokensNo)
        ? parseInt(o.boughtTokensNo)
        : 1;
    });
  return totalBought;
}

export function setInactiveOrdersForAuction(
  ordersState: OrderEntity[],
  auctionId: number,
  modifiedDate: Date,
  exceptWinnerId?: number,
): void {
  ordersState
    .filter(
      (o) =>
        o.auctionId === auctionId &&
        o.status === OrderStatusEnum.Active &&
        o.id !== exceptWinnerId,
    )
    .map((o) => {
      o.status = OrderStatusEnum.Inactive;
      o.modifiedDate = modifiedDate;
    });
}

export function handleChooseWinnerOrderAndReturnId(
  ordersState: OrderEntity[],
  auction: AuctionEntity,
  status: OrderStatusEnum,
): number {
  const bids = ordersState
    .filter(
      (o) => o.auctionId === auction.id && o.status === OrderStatusEnum.Active,
    )
    .map((o) => new BigNumber(o.priceAmount));

  if (bids.length) {
    const maxBid = BigNumber.max(...bids);
    const winnerOrderIndex = ordersState.findIndex(
      (o) =>
        o.auctionId === auction.id &&
        o.status === OrderStatusEnum.Active &&
        o.priceAmount === maxBid.toString(),
    );
    ordersState[winnerOrderIndex].status = status;
    return ordersState[winnerOrderIndex].id;
  }
  return -1;
}

export function handleMarketplaceExpiredAuctionsAndOrders(
  auctionsState: AuctionEntity[],
  ordersState: OrderEntity[],
  currentTimestamp: number,
): void {
  const runningAuctions = auctionsState.filter(
    (a) => a.status === AuctionStatusEnum.Running,
  );
  for (let i = 0; i < runningAuctions.length; i++) {
    if (runningAuctions[i].endDate < currentTimestamp) {
      runningAuctions[i].status = AuctionStatusEnum.Claimable;
      const winnerOrderId = handleChooseWinnerOrderAndReturnId(
        ordersState,
        runningAuctions[i],
        OrderStatusEnum.Active,
      );
      setInactiveOrdersForAuction(
        ordersState,
        runningAuctions[i].id,
        DateUtils.getUtcDateFromTimestamp(runningAuctions[i].endDate),
        winnerOrderId,
      );
    }
  }
}
