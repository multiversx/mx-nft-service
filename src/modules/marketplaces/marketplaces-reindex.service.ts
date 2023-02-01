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

@Injectable()
export class MarketplacesReindexService {
  constructor(
    private readonly persistenceService: PersistenceService,
    private readonly marketplacesService: MarketplacesService,
    private readonly auctionSetterService: AuctionsSetterService,
    private readonly logger: Logger,
  ) {}

  async reindexMarketplaceData(marketplaceAddress: string): Promise<void> {
    try {
      let processInNextBatch: MarketplaceEventsEntity[] = [];

      let afterTimestamp: number;

      let auctionsState: AuctionEntity[] = [];
      let ordersState: OrderEntity[] = [];
      let offersState: OfferEntity[] = [];

      const marketplace =
        await this.marketplacesService.getMarketplaceByAddress(
          marketplaceAddress,
        );

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
          await this.processAuctionEventsBatchAndReturnUnprocessedEvents(
            marketplace,
            processInNextBatch.concat(batch),
            auctionsState,
            ordersState,
            offersState,
          );
      } while (true);

      if (processInNextBatch.length > 0) {
        const unprocessedEvents =
          await this.processAuctionEventsBatchAndReturnUnprocessedEvents(
            marketplace,
            processInNextBatch,
            auctionsState,
            ordersState,
            offersState,
            true,
          );

        if (unprocessedEvents.length > 0) {
          throw new Error(
            `Could not handle ${unprocessedEvents.length} events`,
          );
        }
      }

      this.updateStatesIfDeadline(
        auctionsState,
        ordersState,
        offersState,
        DateUtils.getCurrentTimestamp(),
      );

      await this.addMarketplaceStateToDb(
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

  private async processAuctionEventsBatchAndReturnUnprocessedEvents(
    marketplace: Marketplace,
    batch: MarketplaceEventsEntity[],
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
    finalBatch?: boolean,
  ): Promise<MarketplaceEventsEntity[]> {
    let unprocessedEvents: MarketplaceEventsEntity[] = [...batch];

    while (unprocessedEvents.length > 0) {
      const txHash = unprocessedEvents[0].txHash;

      const eventOrdersAndTx = unprocessedEvents.filter(
        (event) => event.txHash === txHash || event.originalTxHash === txHash,
      );

      const biggerTimestampInBatch = unprocessedEvents.find(
        (e) => e.timestamp > unprocessedEvents[0].timestamp,
      );

      if (
        !finalBatch &&
        (eventOrdersAndTx.length >= unprocessedEvents.length ||
          !biggerTimestampInBatch)
      ) {
        return unprocessedEvents;
      }

      unprocessedEvents = unprocessedEvents.filter(
        (event) => event.txHash !== txHash && event.originalTxHash !== txHash,
      );

      await this.processAuctionEvent(
        marketplace,
        eventOrdersAndTx,
        auctionsState,
        ordersState,
        offersState,
      );
    }

    return [];
  }

  private async processAuctionEvent(
    marketplace: Marketplace,
    eventOrdersAndTx: MarketplaceEventsEntity[],
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
  ): Promise<void> {
    throw new Error('Not implemented yet');
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

  private updateStatesIfDeadline(
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
    timestamp: number,
  ): void {
    const runningAuctions = auctionsState.filter(
      (a) => a.status === AuctionStatusEnum.Running,
    );
    for (let i = 0; i < runningAuctions.length; i++) {
      if (runningAuctions[i].endDate < timestamp) {
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

    for (let i = 0; i < offersState.length; i++) {
      if (
        offersState[i].status === OfferStatusEnum.Active &&
        offersState[i].endDate < timestamp
      ) {
        offersState[i].status = OfferStatusEnum.Expired;
      }
    }
  }

  private async addMarketplaceStateToDb(
    auctionsState: AuctionEntity[],
    ordersState: OrderEntity[],
    offersState: OfferEntity[],
  ): Promise<void> {
    await this.auctionSetterService.saveBulkAuctions(auctionsState);

    for (let i = 0; i < ordersState.length; i++) {
      ordersState[i].auction = auctionsState[ordersState[i].auctionId];
      ordersState[i].auctionId = auctionsState[ordersState[i].auctionId].id;
      console.log(ordersState[i].auctionId);
    }

    await this.persistenceService.saveBulkOrders(ordersState);
    await this.persistenceService.saveBulkOffers(offersState);
  }
}
