import { Injectable, Logger } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AuctionEntity } from 'src/db/auctions';
import { MarketplacesService } from './marketplaces.service';
import { OrderEntity } from 'src/db/orders';
import { Marketplace } from './models';
import { OfferEntity } from 'src/db/offers';
import { AuctionsSetterService } from '../auctions';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplacesReindexEventsSummaryService } from './marketplaces-reindex-events-summary.service';

@Injectable()
export class MarketplacesReindexService {
  constructor(
    private readonly persistenceService: PersistenceService,
    private readonly marketplacesService: MarketplacesService,
    private readonly auctionSetterService: AuctionsSetterService,
    private readonly marketplacesReindexEventsSummaryService: MarketplacesReindexEventsSummaryService,
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
    const eventsSetSummary =
      this.marketplacesReindexEventsSummaryService.getEventsSetSummary(
        marketplace,
        eventOrdersAndTx,
      );

    await this.processEvent(
      marketplace,
      auctionsState,
      ordersState,
      offersState,
      eventsSetSummary,
    );
  }

  private async processEvent(
    marketplace: Marketplace,
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
    eventsSetSummary: any,
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }

  private processMarketplaceExpiredStates(
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
    currentTimestamp: number,
  ): void {
    throw new Error('Not implemented yet');
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
