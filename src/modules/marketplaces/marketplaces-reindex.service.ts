import { Injectable, Logger } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AuctionEntity } from 'src/db/auctions';
import { AuctionStatusEnum } from '../auctions/models/AuctionStatus.enum';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplacesService } from './marketplaces.service';
import { OrderEntity } from 'src/db/orders';
import { OrderStatusEnum } from '../orders/models';
import { Marketplace } from './models';
import { OfferEntity } from 'src/db/offers';
import { OfferStatusEnum } from '../offers/models';
import BigNumber from 'bignumber.js';
import { AuctionsSetterService } from '../auctions';
import {
  AssetActionEnum,
  AuctionEventEnum,
  ElrondNftsSwapAuctionEventEnum,
  ExternalAuctionEventEnum,
  NftEventEnum,
  NftEventTypeEnum,
} from '../assets/models';
import { MarketplaceEventLogInput } from './models/MarketplaceEventLogInput';
import { MarketplaceTypeEnum } from './models/MarketplaceType.enum';
import { BinaryUtils } from '@elrondnetwork/erdnest';
import { AssetOfferEnum } from '../assets/models/AssetOfferEnum';
import { AssetByIdentifierService } from '../assets';
import { UsdPriceService } from '../usdPrice/usd-price.service';
import { mxConfig } from 'src/config';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { AuctionTypeEnum } from '../auctions/models';

@Injectable()
export class MarketplacesReindexService {
  constructor(
    private readonly persistenceService: PersistenceService,
    private readonly marketplacesService: MarketplacesService,
    private readonly auctionSetterService: AuctionsSetterService,
    private readonly assetByIdentifierService: AssetByIdentifierService,
    private readonly usdPriceService: UsdPriceService,
    private readonly logger: Logger,
  ) {}

  async reindexMarketplaceData(marketplaceAddress: string): Promise<void> {
    try {
      let auctionsState: AuctionEntity[] = [];
      let ordersState: OrderEntity[] = [];
      let offersState: OfferEntity[] = [];

      await this.processMarketplaceEventsInBatches(
        marketplaceAddress,
        auctionsState,
        ordersState,
        offersState,
      );

      this.processMarketplaceExpiredStates(
        auctionsState,
        ordersState,
        offersState,
        DateUtils.getCurrentTimestamp(),
      );

      await this.addMarketplaceStatesToDb(
        auctionsState,
        ordersState,
        offersState,
      );
    } catch (error) {
      this.logger.error('An error occurred while reindexing marketplace data', {
        path: `${MarketplacesReindexService.name}.${this.reindexMarketplaceData.name}`,
        marketplaceAddress,
        exception: error,
      });
    }
  }

  private async processMarketplaceEventsInBatches(
    marketplaceAddress: string,
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
  ): Promise<void> {
    const marketplace = await this.marketplacesService.getMarketplaceByAddress(
      marketplaceAddress,
    );

    let afterTimestamp: number;
    let processInNextBatch: MarketplaceEventsEntity[] = [];

    do {
      let batch = await this.persistenceService.getMarketplaceEventsAsc(
        marketplaceAddress,
        afterTimestamp,
      );

      if (!batch || batch.length === 0) {
        break;
      }

      afterTimestamp =
        this.sliceBatchIfPartialEventsSetAndGetNewestTimestamp(batch);

      processInNextBatch =
        await this.processEventsBatchAndReturnUnprocessedEvents(
          marketplace,
          processInNextBatch.concat(batch),
          auctionsState,
          ordersState,
          offersState,
        );
    } while (true);

    const isFinalBatch = true;
    processInNextBatch =
      await this.processEventsBatchAndReturnUnprocessedEvents(
        marketplace,
        processInNextBatch,
        auctionsState,
        ordersState,
        offersState,
        isFinalBatch,
      );

    if (processInNextBatch.length > 0) {
      throw new Error(`Could not handle ${processInNextBatch.length} events`);
    }
  }

  private sliceBatchIfPartialEventsSetAndGetNewestTimestamp(
    eventsBatch: MarketplaceEventsEntity[],
  ): number {
    const oldestTimestamp = eventsBatch[0].timestamp;
    let newestTimestamp = eventsBatch[eventsBatch.length - 1].timestamp;

    if (newestTimestamp !== oldestTimestamp) {
      eventsBatch = eventsBatch.slice(
        0,
        eventsBatch.findIndex((event) => event.timestamp === newestTimestamp),
      );
      newestTimestamp = eventsBatch[eventsBatch.length - 1].timestamp;
    }

    return newestTimestamp;
  }

  private async processEventsBatchAndReturnUnprocessedEvents(
    marketplace: Marketplace,
    batch: MarketplaceEventsEntity[],
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
    isFinalBatch?: boolean,
  ): Promise<MarketplaceEventsEntity[]> {
    let unprocessedEvents: MarketplaceEventsEntity[] = [...batch];

    while (unprocessedEvents.length > 0) {
      const txHash = unprocessedEvents[0].txHash;

      const eventOrdersAndTx = unprocessedEvents.filter(
        (event) => event.txHash === txHash || event.originalTxHash === txHash,
      );

      const isAnotherEventsSetInBatch = unprocessedEvents.find(
        (e) => e.timestamp > unprocessedEvents[0].timestamp,
      );

      if (
        !isFinalBatch &&
        (eventOrdersAndTx.length === unprocessedEvents.length ||
          !isAnotherEventsSetInBatch)
      ) {
        return unprocessedEvents;
      }

      unprocessedEvents = unprocessedEvents.filter(
        (event) => event.txHash !== txHash && event.originalTxHash !== txHash,
      );

      await this.processEventsSet(
        marketplace,
        eventOrdersAndTx,
        auctionsState,
        ordersState,
        offersState,
      );
    }

    return [];
  }

  private async processEventsSet(
    marketplace: Marketplace,
    eventOrdersAndTx: MarketplaceEventsEntity[],
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
  ): Promise<void> {
    const [eventCategory, eventType, index] =
      await this.getEventCategoryTypeAndMainEventIndex(
        eventOrdersAndTx,
        marketplace,
      );

    if (!eventCategory) {
      return;
    }

    switch (eventCategory) {
      case NftEventTypeEnum.AuctionEventEnum: {
        await this.processEvent(
          marketplace,
          auctionsState,
          ordersState,
          offersState,
          MarketplaceEventLogInput.fromInternalMarketplaceEventAndTx(
            eventOrdersAndTx,
            eventType,
            index,
          ),
        );
        break;
      }
      case NftEventTypeEnum.ExternalAuctionEventEnum: {
        await this.processEvent(
          marketplace,
          auctionsState,
          ordersState,
          offersState,
          MarketplaceEventLogInput.fromExternalMarketplaceEventAndTx(
            eventOrdersAndTx,
            eventType,
            index,
          ),
        );
        break;
      }
      case NftEventTypeEnum.ElrondNftsSwapAuctionEventEnum: {
        await this.processEvent(
          marketplace,
          auctionsState,
          ordersState,
          offersState,
          MarketplaceEventLogInput.fromElrondNftSwapMarketplaceEventAndTx(
            eventOrdersAndTx,
            eventType,
            index,
          ),
        );
        break;
      }
    }
  }

  private async processEvent(
    marketplace: Marketplace,
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
    input: MarketplaceEventLogInput,
  ): Promise<void> {
    if (!input) {
      return;
    }

    const auctionId = BinaryUtils.hexToNumber(input.auctionId);
    const offerId = parseInt(input.offerId);
    const nonce = BinaryUtils.hexToNumber(input.nonce);
    const itemsCount = parseInt(input.itemsCount);
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    if (!auctionId && !offerId) {
      console.log(JSON.stringify(input));
      throw new Error('?');
    }

    let auctionIndex: number;
    if (input.identifier !== AssetActionEnum.StartedAuction) {
      auctionIndex = auctionsState.findIndex(
        (a) => a.marketplaceAuctionId === auctionId,
      );
    }
    let offerIndex: number;
    if (input.identifier !== AssetOfferEnum.Created) {
      offerIndex = offersState.findIndex(
        (o) => o.marketplaceOfferId === offerId,
      );
    }

    const paymentNonce = !Number.isNaN(
      input.paymentNonce ?? auctionsState[auctionIndex]?.paymentNonce,
    )
      ? input.paymentNonce ?? auctionsState[auctionIndex]?.paymentNonce
      : 0;
    const paymentTokenIdentifier =
      input.paymentToken ?? auctionsState[auctionIndex]?.paymentToken;

    switch (input.action) {
      case AssetActionEnum.StartedAuction: {
        const [asset, paymentToken] = await Promise.all([
          this.assetByIdentifierService.getAsset(input.identifier),
          this.usdPriceService.getToken(input.paymentToken),
        ]);

        const decimals = paymentToken?.decimals ?? mxConfig.decimals;
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
          minBidDenominated: BigNumberUtils.denominateAmount(
            input.minBid,
            decimals,
          ),
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
        break;
      }
      case AssetActionEnum.Bought: {
        const paymentToken = await this.usdPriceService.getToken(
          auctionsState[auctionIndex].paymentToken,
        );

        this.setInactiveOrdersForAuction(
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
            paymentToken.decimals,
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

        let totalBought = 0;
        ordersState
          .filter(
            (o) =>
              o.auctionId === auctionsState[auctionIndex].id &&
              o.status === OrderStatusEnum.Bought,
          )
          .forEach((o) => {
            totalBought += Number.isInteger(o.boughtTokensNo)
              ? parseInt(o.boughtTokensNo)
              : 1;
          });

        if (auctionsState[auctionIndex].nrAuctionedTokens === totalBought) {
          auctionsState[auctionIndex].status = AuctionStatusEnum.Ended;
          auctionsState[auctionIndex].modifiedDate = modifiedDate;
          auctionsState[auctionIndex].blockHash =
            auctionsState[auctionIndex].blockHash ?? input.blockHash;
        }
        break;
      }
      case AssetActionEnum.EndedAuction: {
        auctionsState[auctionIndex].status = AuctionStatusEnum.Ended;
        auctionsState[auctionIndex].blockHash =
          auctionsState[auctionIndex].blockHash ?? input.blockHash;
        auctionsState[auctionIndex].modifiedDate = modifiedDate;

        const winnerOrderId = this.handleChooseWinnerOrderAndReturnId(
          ordersState,
          auctionsState[auctionIndex],
          OrderStatusEnum.Bought,
        );

        this.setInactiveOrdersForAuction(
          ordersState,
          auctionsState[auctionIndex].id,
          modifiedDate,
          winnerOrderId,
        );

        break;
      }
      case AssetActionEnum.ClosedAuction: {
        auctionsState[auctionIndex].status = AuctionStatusEnum.Closed;
        auctionsState[auctionIndex].blockHash =
          auctionsState[auctionIndex].blockHash ?? input.blockHash;
        auctionsState[auctionIndex].modifiedDate = modifiedDate;

        this.setInactiveOrdersForAuction(
          ordersState,
          auctionsState[auctionIndex].id,
          modifiedDate,
        );

        break;
      }
      case AssetOfferEnum.Created: {
        const paymentToken = await this.usdPriceService.getToken(
          input.paymentToken,
        );
        const offer = new OfferEntity({
          id: offersState.length,
          creationDate: modifiedDate,
          modifiedDate,
          marketplaceOfferId: offerId,
          blockHash: input.blockHash,
          collection: input.collection,
          identifier: input.identifier,
          priceToken: input.paymentToken,
          priceNonce: input.paymentNonce,
          priceAmount: input.price,
          priceAmountDenominated: BigNumberUtils.denominateAmount(
            input.price,
            paymentToken.decimals,
          ),
          ownerAddress: input.address,
          endDate: input.endTime,
          boughtTokensNo: input.itemsCount,
          marketplaceKey: marketplace.key,
          status: OfferStatusEnum.Active,
        });
        offersState.push(offer);
        break;
      }
      case AssetOfferEnum.Accepted: {
        offersState[offerIndex].status = OfferStatusEnum.Accepted;
        offersState[offerIndex].modifiedDate = modifiedDate;
        break;
      }
      case AssetOfferEnum.Closed: {
        offersState[offerIndex].status = OfferStatusEnum.Closed;
        offersState[offerIndex].modifiedDate = modifiedDate;
        break;
      }
      case AssetOfferEnum.AuctionClosedAndOfferAccepted: {
        offersState[offerIndex].status = OfferStatusEnum.Accepted;
        offersState[offerIndex].modifiedDate = modifiedDate;
        
        auctionsState[auctionIndex].status = AuctionStatusEnum.Closed;
        auctionsState[auctionIndex].blockHash =
          auctionsState[auctionIndex].blockHash ?? input.blockHash;
        auctionsState[auctionIndex].modifiedDate = modifiedDate;

        this.setInactiveOrdersForAuction(
          ordersState,
          auctionsState[auctionIndex].id,
          modifiedDate,
        );
        break;
      }
      default: {
        if (input.auctionType) {
          throw new Error(`Case not handled ${input.auctionType}`);
        }

        const paymentToken = await this.usdPriceService.getToken(
          auctionsState[auctionIndex].paymentToken,
        );

        this.setInactiveOrdersForAuction(
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
            paymentToken.decimals,
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
    }
  }

  private async getEventCategoryTypeAndMainEventIndex(
    eventsAndTx: MarketplaceEventsEntity[],
    marketplace: Marketplace,
  ): Promise<[string, string, number]> {
    const eventsSortedByOrderAsc = eventsAndTx.sort((a, b) => {
      return a.eventOrder - b.eventOrder;
    });

    const txData = eventsAndTx[0].isTx ? eventsAndTx[0] : undefined;

    const eventsStartIdx = txData ? 1 : 0;

    if (eventsSortedByOrderAsc.length === 1 && txData) {
      const topics = txData.data.txData.data.split('@');
      const eventIdentifier = topics[0];
      const eventCategory = await this.getEventCategory(
        eventIdentifier,
        marketplace,
      );
      this.logger.warn(`No events found for ${txData.data.txData.blockHash}`);
      return [eventCategory, eventIdentifier, 0];
    }

    const events = eventsSortedByOrderAsc.map((event) => event.data.eventData);

    for (let i = eventsStartIdx; i < events.length; i++) {
      const eventIdentifier: any = events[i].identifier;
      const eventCategory = await this.getEventCategory(
        eventIdentifier,
        marketplace,
      );
      if (eventCategory) {
        return [eventCategory, eventIdentifier, i];
      }
    }

    return [
      NftEventTypeEnum.NftEventEnum,
      eventsSortedByOrderAsc[eventsStartIdx].data.eventData.identifier,
      eventsStartIdx,
    ];
  }

  private async getEventCategory(
    eventIdentifier: any,
    marketplace: Marketplace,
  ): Promise<string> {
    if (
      eventIdentifier !== NftEventEnum.ESDTNFTTransfer &&
      eventIdentifier !== NftEventEnum.MultiESDTNFTTransfer &&
      Object.values(NftEventEnum).includes(eventIdentifier)
    ) {
      return NftEventTypeEnum.NftEventEnum;
    }

    if (Object.values(AuctionEventEnum).includes(eventIdentifier)) {
      if (eventIdentifier !== AuctionEventEnum.BidEvent) {
        return NftEventTypeEnum.AuctionEventEnum;
      } else {
        if (marketplace.type === MarketplaceTypeEnum.Internal) {
          return NftEventTypeEnum.AuctionEventEnum;
        }
      }
    }

    if (Object.values(ExternalAuctionEventEnum).includes(eventIdentifier)) {
      return NftEventTypeEnum.ExternalAuctionEventEnum;
    }

    if (
      Object.values(ElrondNftsSwapAuctionEventEnum).includes(eventIdentifier)
    ) {
      if (eventIdentifier !== ElrondNftsSwapAuctionEventEnum.Bid) {
        return NftEventTypeEnum.ElrondNftsSwapAuctionEventEnum;
      } else {
        if (marketplace.type === MarketplaceTypeEnum.External) {
          return NftEventTypeEnum.ElrondNftsSwapAuctionEventEnum;
        }
      }
    }
  }

  private setInactiveOrdersForAuction(
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

  private handleChooseWinnerOrderAndReturnId(
    ordersState: OrderEntity[],
    auction: AuctionEntity,
    status: OrderStatusEnum,
  ): number {
    const bids = ordersState
      .filter(
        (o) =>
          o.auctionId === auction.id && o.status === OrderStatusEnum.Active,
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

  private processMarketplaceExpiredStates(
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
    currentTimestamp: number,
  ): void {
    this.processMarketplaceExpiredAuctionsAndOrders(
      auctionsState,
      ordersState,
      currentTimestamp,
    );
    this.processMarketplaceExpiredOffers(offersState, currentTimestamp);
  }

  private processMarketplaceExpiredAuctionsAndOrders(
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
        const winnerOrderId = this.handleChooseWinnerOrderAndReturnId(
          ordersState,
          runningAuctions[i],
          OrderStatusEnum.Active,
        );
        this.setInactiveOrdersForAuction(
          ordersState,
          runningAuctions[i].id,
          DateUtils.getUtcDateFromTimestamp(runningAuctions[i].endDate),
          winnerOrderId,
        );
      }
    }
  }

  private processMarketplaceExpiredOffers(
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

  private async addMarketplaceStatesToDb(
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
  ): Promise<void> {
    await this.auctionSetterService.saveBulkAuctions(auctionsState);

    for (let i = 0; i < ordersState.length; i++) {
      ordersState[i].auction = auctionsState[ordersState[i].auctionId];
      ordersState[i].auctionId = auctionsState[ordersState[i].auctionId].id;
    }

    await this.persistenceService.saveBulkOrders(ordersState);
    await this.persistenceService.saveBulkOffers(offersState);
  }
}
