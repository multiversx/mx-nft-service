import { Injectable, Logger } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AuctionEntity } from 'src/db/auctions';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplacesService } from './marketplaces.service';
import { OrderEntity } from 'src/db/orders';
import { Marketplace } from './models';
import { OfferEntity } from 'src/db/offers';
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
import { AssetOfferEnum } from '../assets/models/AssetOfferEnum';
import { AssetByIdentifierService } from '../assets';
import { UsdPriceService } from '../usdPrice/usd-price.service';
import {
  getAuctionIndex,
  handleMarketplaceExpiredAuctionsAndOrders,
  handleMarketplaceReindexAuctionBidEvent,
  handleMarketplaceReindexBoughtAuctionEvent,
  handleMarketplaceReindexClosedAuctionEvent,
  handleMarketplaceReindexEndedAuctionEvent,
  handleMarketplaceReindexStartedAuctionEvent,
} from './marketplaces-reindex-handlers/marketplace-reindex-auctions.handlers';
import {
  handleMarketplaceExpiredOffers,
  handleMarketplaceReindexAcceptedOfferEvent,
  handleMarketplaceReindexClosedOfferEvent,
  handleMarketplaceReindexCreatedOfferEvent,
} from './marketplaces-reindex-handlers/marketplace-reindex-offers.handlers';
import { Token } from 'src/common/services/mx-communication/models/Token.model';

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

      [batch, afterTimestamp] =
        this.getSlicedBatchAndNewestTimestampIfPartialEventsSet(batch);

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

  private getSlicedBatchAndNewestTimestampIfPartialEventsSet(
    eventsBatch: MarketplaceEventsEntity[],
  ): [MarketplaceEventsEntity[], number] {
    const oldestTimestamp = eventsBatch[0].timestamp;
    let newestTimestamp = eventsBatch[eventsBatch.length - 1].timestamp;

    if (newestTimestamp !== oldestTimestamp) {
      eventsBatch = eventsBatch.slice(
        0,
        eventsBatch.findIndex((event) => event.timestamp === newestTimestamp),
      );
      newestTimestamp = eventsBatch[eventsBatch.length - 1].timestamp;
    }

    return [eventsBatch, newestTimestamp];
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

    switch (input.action) {
      case AssetActionEnum.StartedAuction: {
        const [asset, [paymentToken, paymentNonce]] = await Promise.all([
          this.assetByIdentifierService.getAsset(input.identifier),
          this.getPaymentTokenAndNonce(auctionsState, input),
        ]);
        handleMarketplaceReindexStartedAuctionEvent(
          input,
          marketplace,
          auctionsState,
          paymentToken.identifier,
          paymentNonce,
          paymentToken.decimals,
          asset,
        );
        break;
      }
      case AssetActionEnum.Bought: {
        const [paymentToken, paymentNonce] = await this.getPaymentTokenAndNonce(
          auctionsState,
          input,
        );
        handleMarketplaceReindexBoughtAuctionEvent(
          input,
          marketplace,
          auctionsState,
          ordersState,
          paymentToken.identifier,
          paymentNonce,
          paymentToken.decimals,
        );
        break;
      }
      case AssetActionEnum.EndedAuction: {
        handleMarketplaceReindexEndedAuctionEvent(
          input,
          auctionsState,
          ordersState,
        );
        break;
      }
      case AssetActionEnum.ClosedAuction: {
        handleMarketplaceReindexClosedAuctionEvent(
          input,
          auctionsState,
          ordersState,
        );
        break;
      }
      case AssetOfferEnum.Created: {
        const [paymentToken] = await this.getPaymentTokenAndNonce(
          auctionsState,
          input,
        );
        handleMarketplaceReindexCreatedOfferEvent(
          input,
          marketplace,
          offersState,
          paymentToken.decimals,
        );
        break;
      }
      case AssetOfferEnum.Accepted: {
        handleMarketplaceReindexAcceptedOfferEvent(input, offersState);
        break;
      }
      case AssetOfferEnum.Closed: {
        handleMarketplaceReindexClosedOfferEvent(input, offersState);
        break;
      }
      case AssetOfferEnum.AuctionClosedAndOfferAccepted: {
        handleMarketplaceReindexClosedAuctionEvent(
          input,
          auctionsState,
          ordersState,
        );
        handleMarketplaceReindexAcceptedOfferEvent(input, offersState);
        break;
      }
      default: {
        if (input.auctionType) {
          throw new Error(`Case not handled ${input.auctionType}`);
        }

        const [paymentToken, paymentNonce] = await this.getPaymentTokenAndNonce(
          auctionsState,
          input,
        );

        handleMarketplaceReindexAuctionBidEvent(
          input,
          marketplace,
          auctionsState,
          ordersState,
          paymentToken.identifier,
          paymentNonce,
          paymentToken.decimals,
        );
      }
    }
  }

  private async getPaymentTokenAndNonce(
    auctionsState: AuctionEntity[],
    input: MarketplaceEventLogInput,
  ): Promise<[Token, number]> {
    const auctionIndex = getAuctionIndex(auctionsState, input);
    const paymentNonce = !Number.isNaN(
      input.paymentNonce ?? auctionsState[auctionIndex]?.paymentNonce,
    )
      ? input.paymentNonce ?? auctionsState[auctionIndex]?.paymentNonce
      : 0;
    const paymentTokenIdentifier =
      input.paymentToken ?? auctionsState[auctionIndex]?.paymentToken;
    const paymentToken = await this.usdPriceService.getToken(
      paymentTokenIdentifier,
    );
    return [paymentToken, paymentNonce];
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

    if (
      marketplace.type === MarketplaceTypeEnum.Internal &&
      Object.values(AuctionEventEnum).includes(eventIdentifier)
    ) {
      return NftEventTypeEnum.AuctionEventEnum;
    }

    if (Object.values(ExternalAuctionEventEnum).includes(eventIdentifier)) {
      return NftEventTypeEnum.ExternalAuctionEventEnum;
    }

    if (
      Object.values(ElrondNftsSwapAuctionEventEnum).includes(eventIdentifier)
    ) {
      return NftEventTypeEnum.ElrondNftsSwapAuctionEventEnum;
    }
  }

  private processMarketplaceExpiredStates(
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
    currentTimestamp: number,
  ): void {
    handleMarketplaceExpiredAuctionsAndOrders(
      auctionsState,
      ordersState,
      currentTimestamp,
    );
    handleMarketplaceExpiredOffers(offersState, currentTimestamp);
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
