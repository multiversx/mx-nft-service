import { Injectable, Logger } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { AuctionEntity } from 'src/db/auctions';
import { MarketplacesService } from './marketplaces.service';
import { AuctionsSetterService } from '../auctions';
import { AssetActionEnum } from '../assets/models';
import { AssetOfferEnum } from '../assets/models/AssetOfferEnum';
import { UsdPriceService } from '../usdPrice/usd-price.service';
import { MarketplacesReindexEventsSummaryService } from './marketplaces-reindex-events-summary.service';
import { ReindexAuctionStartedHandler } from './marketplaces-reindex-handlers/reindex-auction-started.handler';
import { ReindexAuctionBidHandler } from './marketplaces-reindex-handlers/reindex-auction-bid.handler';
import { ReindexAuctionBoughtHandler } from './marketplaces-reindex-handlers/reindex-auction-bought.handler';
import { ReindexAuctionEndedHandler } from './marketplaces-reindex-handlers/reindex-auction-ended.handler';
import { ReindexAuctionClosedHandler } from './marketplaces-reindex-handlers/reindex-auction-closed.handler';
import { ReindexOfferAcceptedHandler } from './marketplaces-reindex-handlers/reindex-offer-accepted.handler';
import { ReindexOfferClosedHandler } from './marketplaces-reindex-handlers/reindex-offer-closed.handler';
import { ReindexOfferCreatedHandler } from './marketplaces-reindex-handlers/reindex-offer-created.hander';
import { ReindexAuctionPriceUpdatedHandler } from './marketplaces-reindex-handlers/reindex-auction-price-updated.handler';
import { ReindexGlobalOfferAcceptedHandler } from './marketplaces-reindex-handlers/reindex-global-offer-accepted.handler';
import { ReindexAuctionUpdatedHandler } from './marketplaces-reindex-handlers/reindex-auction-updated.handler';
import { constants, mxConfig } from 'src/config';
import { MarketplaceReindexState } from './models/MarketplaceReindexState';
import { MxApiService } from 'src/common';
import { MarketplaceReindexDataArgs } from './models/MarketplaceReindexDataArgs';
import { ELRONDNFTSWAP_KEY } from 'src/utils/constants';
import { Locker } from '@multiversx/sdk-nestjs-common';
import { MarketplaceTypeEnum } from './models/MarketplaceType.enum';
import { OrdersService } from '../orders/order.service';
import { Token } from '../usdPrice/Token.model';
import { CpuProfiler } from '@multiversx/sdk-nestjs-monitoring';
import { TagEntity } from 'src/db/auctions/tags.entity';

@Injectable()
export class MarketplacesReindexService {
  constructor(
    private readonly persistenceService: PersistenceService,
    private readonly marketplacesService: MarketplacesService,
    private readonly usdPriceService: UsdPriceService,
    private readonly auctionSetterService: AuctionsSetterService,
    private readonly ordersService: OrdersService,
    private readonly marketplacesReindexEventsSummaryService: MarketplacesReindexEventsSummaryService,
    private readonly reindexAuctionStartedHandler: ReindexAuctionStartedHandler,
    private readonly reindexAuctionBidHandler: ReindexAuctionBidHandler,
    private readonly reindexAuctionBoughtHandler: ReindexAuctionBoughtHandler,
    private readonly reindexAuctionEndedHandler: ReindexAuctionEndedHandler,
    private readonly reindexAuctionClosedHandler: ReindexAuctionClosedHandler,
    private readonly reindexAuctionPriceUpdatedHandler: ReindexAuctionPriceUpdatedHandler,
    private readonly reindexAuctionUpdatedHandler: ReindexAuctionUpdatedHandler,
    private readonly reindexOfferCreatedHandler: ReindexOfferCreatedHandler,
    private readonly reindexOfferAcceptedHandler: ReindexOfferAcceptedHandler,
    private readonly reindexOfferClosedHandler: ReindexOfferClosedHandler,
    private readonly reindexGlobalOfferAcceptedHandler: ReindexGlobalOfferAcceptedHandler,
    private readonly mxApiService: MxApiService,
    private readonly logger: Logger,
  ) {}

  async reindexMarketplaceData(input: MarketplaceReindexDataArgs): Promise<void> {
    this.logger.log(`Reindexing marketplace data/state for ${input.marketplaceAddress} started`);
    await Locker.lock(
      `Reindex marketplace data/state for ${input.marketplaceAddress}`,
      async () => {
        try {
          let marketplaceReindexStates: MarketplaceReindexState[] = await this.getInitialMarketplaceReindexStates(input);

          await this.processMarketplaceEventsInBatchesAndAddToDb(marketplaceReindexStates, input);

          this.logger.log(`Reindexing marketplace data/state for ${input.marketplaceAddress} ended`);
        } catch (error) {
          console.log(error);
          this.logger.error('An error occurred while reindexing marketplace data', {
            path: `${MarketplacesReindexService.name}.${this.reindexMarketplaceData.name}`,
            marketplaceAddress: input.marketplaceAddress,
            exception: error,
          });
        }
      },
      true,
    );
  }

  private async getInitialMarketplaceReindexStates(input: MarketplaceReindexDataArgs): Promise<MarketplaceReindexState[]> {
    let marketplaceReindexStates: MarketplaceReindexState[] = [];

    const marketplace = await this.marketplacesService.getMarketplaceByAddress(input.marketplaceAddress);

    if (marketplace.type === MarketplaceTypeEnum.External) {
      return [
        new MarketplaceReindexState({
          marketplace,
          isFullStateInMemory: input.afterTimestamp ? false : true,
        }),
      ];
    }

    const internalMarketplaces = await this.marketplacesService.getInternalMarketplacesByAddress(marketplace.address);

    for (let i = 0; i < internalMarketplaces.length; i++) {
      const marketplaceCollections = await this.marketplacesService.getCollectionsByMarketplace(internalMarketplaces[i].key);

      marketplaceReindexStates.push(
        new MarketplaceReindexState({
          marketplace: internalMarketplaces[i],
          isFullStateInMemory: input.afterTimestamp ? false : true,
          listedCollections: marketplaceCollections,
        }),
      );
    }

    return marketplaceReindexStates;
  }

  private async processMarketplaceEventsInBatchesAndAddToDb(
    marketplaceReindexStates: MarketplaceReindexState[],
    input: MarketplaceReindexDataArgs,
  ): Promise<void> {
    let afterTimestamp = input.afterTimestamp;
    let processInNextBatch: MarketplaceEventsEntity[] = [];
    let nextBatchPromise: Promise<MarketplaceEventsEntity[]>;

    nextBatchPromise = this.persistenceService.getMarketplaceEventsAsc(marketplaceReindexStates[0].marketplace.address, afterTimestamp);

    do {
      const cpu = new CpuProfiler();
      let batch = await nextBatchPromise;
      console.log({ batch: batch.length, afterTimestamp });
      if (!batch || batch.length === 0) {
        break;
      }
      cpu.stop('batch');

      const getSlicedBatchAndNewestTimestampIfPartialEventsSet = new CpuProfiler();
      [batch, afterTimestamp] = this.getSlicedBatchAndNewestTimestampIfPartialEventsSet(batch, input.beforeTimestamp);

      getSlicedBatchAndNewestTimestampIfPartialEventsSet.stop('getSlicedBatchAndNewestTimestampIfPartialEventsSet');
      nextBatchPromise = this.persistenceService.getMarketplaceEventsAsc(marketplaceReindexStates[0].marketplace.address, afterTimestamp);

      processInNextBatch = await this.processEventsBatchAndReturnUnprocessedEvents(
        marketplaceReindexStates,
        processInNextBatch.concat(batch),
      );
      console.log({
        auctions: marketplaceReindexStates[0].auctionMap.size,
        offers: marketplaceReindexStates[0].offers.length,
      });
      // await this.addInactiveStateItemsToDb(marketplaceReindexStates);
    } while (input.beforeTimestamp ? afterTimestamp < input.beforeTimestamp : true);

    const isFinalBatch = true;
    processInNextBatch = await this.processEventsBatchAndReturnUnprocessedEvents(
      marketplaceReindexStates,
      processInNextBatch,
      isFinalBatch,
    );

    await this.addInactiveStateItemsToDb(marketplaceReindexStates, isFinalBatch);

    if (processInNextBatch.length > 0) {
      this.logger.warn(`Could not handle ${processInNextBatch.length} events`);
    }
  }

  private getSlicedBatchAndNewestTimestampIfPartialEventsSet(
    eventsBatch: MarketplaceEventsEntity[],
    beforeTimestamp: number,
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

    if (newestTimestamp > beforeTimestamp) {
      return [eventsBatch.filter((e) => e.timestamp < beforeTimestamp), beforeTimestamp];
    }

    return [eventsBatch, newestTimestamp];
  }

  private async processEventsBatchAndReturnUnprocessedEvents(
    marketplaceReindexStates: MarketplaceReindexState[],
    batch: MarketplaceEventsEntity[],
    isFinalBatch?: boolean,
  ): Promise<MarketplaceEventsEntity[]> {
    const eventsMap: Map<string, MarketplaceEventsEntity[]> = new Map();

    batch.forEach((event) => {
      const txHash = event.txHash || event.originalTxHash || ''; // Adjust accordingly
      if (!eventsMap.has(txHash)) {
        eventsMap.set(txHash, []);
      }
      eventsMap.get(txHash).push(event);
    });

    let unprocessedEvents: MarketplaceEventsEntity[] = [...batch];

    for (const [txHash, eventOrdersAndTx] of eventsMap) {
      const isAnotherEventsSetInBatch = unprocessedEvents.find((e) => e.timestamp > eventOrdersAndTx[0].timestamp);

      if (!isFinalBatch && (eventOrdersAndTx.length === unprocessedEvents.length || !isAnotherEventsSetInBatch)) {
        return unprocessedEvents;
      }

      unprocessedEvents = unprocessedEvents.filter((event) => event.txHash !== txHash && event.originalTxHash !== txHash);

      await this.processEventsSet(marketplaceReindexStates, eventOrdersAndTx);
    }

    return [];
  }

  private async processEventsSet(
    marketplaceReindexStates: MarketplaceReindexState[],
    eventOrdersAndTx: MarketplaceEventsEntity[],
  ): Promise<void> {
    const eventsSetSummaries = this.marketplacesReindexEventsSummaryService.getEventsSetSummaries(
      marketplaceReindexStates[0].marketplace,
      eventOrdersAndTx,
    );

    for (const state of marketplaceReindexStates) {
      await this.getStateFromDbIfMissing(state, eventsSetSummaries);
    }

    const areMultipleMarketplaces = marketplaceReindexStates.length !== 1;

    for (let i = 0; i < eventsSetSummaries?.length; i++) {
      try {
        if (!areMultipleMarketplaces) {
          await this.processEvent(marketplaceReindexStates[0], eventsSetSummaries[i]);
          continue;
        }

        const stateIndex = marketplaceReindexStates.findIndex((s) => s.isCollectionListed(eventsSetSummaries[i].collection));
        if (stateIndex !== -1) {
          await this.processEvent(marketplaceReindexStates[stateIndex], eventsSetSummaries[i]);
        }
      } catch (error) {
        console.log({ error });
        this.logger.warn(`Error reprocessing marketplace event ${JSON.stringify(eventsSetSummaries[i])} - ${JSON.stringify(error)}`);
      }
    }
  }

  private async getStateFromDbIfMissing(marketplaceReindexState: MarketplaceReindexState, eventsSetSummaries: any[]): Promise<void> {
    if (marketplaceReindexState.isFullStateInMemory) {
      return;
    }

    const [missingMarketplaceAuctionsIds, missingMarketplaceOffersIds, missingStateForIdentifiers] = this.getMissingStateIds(
      marketplaceReindexState,
      eventsSetSummaries,
    );

    let auctions: AuctionEntity[];
    if (missingMarketplaceAuctionsIds.length > 0) {
      auctions = await this.persistenceService.getBulkAuctionsByAuctionIdsAndMarketplace(
        missingMarketplaceAuctionsIds,
        marketplaceReindexState.marketplace.key,
      );
    } else if (missingStateForIdentifiers.length > 0) {
      auctions = await this.persistenceService.getBulkAuctionsByIdentifierAndMarketplace(
        missingStateForIdentifiers,
        marketplaceReindexState.marketplace.key,
      );
    }

    const missingAuctionsIds = auctions?.map((a) => a.id);

    const [orders, offers] = await Promise.all([
      missingAuctionsIds?.length > 0 ? this.ordersService.getOrdersByAuctionIds(missingAuctionsIds) : [],
      missingMarketplaceOffersIds?.length > 0
        ? this.persistenceService.getBulkOffersByOfferIdsAndMarketplace(
            missingMarketplaceOffersIds,
            marketplaceReindexState.marketplace.key,
          )
        : [],
    ]);

    if (offers?.length > 0) {
      marketplaceReindexState.offers = marketplaceReindexState.offers.concat(offers);
    }
  }

  private getMissingStateIds(marketplaceReindexState: MarketplaceReindexState, eventsSetSummaries: any[]): [number[], number[], string[]] {
    let missingAuctionIds: number[] = [];
    let missingOfferIds: number[] = [];
    let missingStateForIdentifiers: string[] = [];

    for (let i = 0; i < eventsSetSummaries?.length; i++) {
      if (!eventsSetSummaries[i]) {
        continue;
      }

      if (
        eventsSetSummaries[i].auctionId &&
        eventsSetSummaries[i].action !== AssetActionEnum.StartedAuction &&
        eventsSetSummaries[i].action !== AssetOfferEnum.Created
      ) {
        const auctionIndex =
          marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
            ? marketplaceReindexState.auctionMap.get(eventsSetSummaries[i].auctionId)
            : marketplaceReindexState.auctionMap.get(eventsSetSummaries[i].identifier);
        if (!auctionIndex) {
          marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
            ? missingAuctionIds.push(eventsSetSummaries[i].auctionId)
            : missingStateForIdentifiers.push(eventsSetSummaries[i].identifier);
        }
      }

      if (eventsSetSummaries[i].offerId && eventsSetSummaries[i].action !== AssetOfferEnum.Created) {
        const offerIndex = marketplaceReindexState.getOfferIndexByOfferId(eventsSetSummaries[i].offerId);
        if (offerIndex === -1) {
          missingOfferIds.push(eventsSetSummaries[i].offerId);
        }
      }
    }

    return [[...new Set(missingAuctionIds)], [...new Set(missingOfferIds)], [...new Set(missingStateForIdentifiers)]];
  }

  private async processEvent(marketplaceReindexState: MarketplaceReindexState, eventsSetSummary: any): Promise<void> {
    if (!eventsSetSummary) {
      return;
    }
    switch (eventsSetSummary.action) {
      case AssetActionEnum.StartedAuction: {
        const [paymentToken, paymentNonce] = await this.getPaymentTokenAndNonce(marketplaceReindexState, eventsSetSummary);
        this.reindexAuctionStartedHandler.handle(eventsSetSummary, marketplaceReindexState, paymentToken, paymentNonce);
        break;
      }
      case AssetActionEnum.Bid: {
        const [paymentToken, paymentNonce] = await this.getPaymentTokenAndNonce(marketplaceReindexState, eventsSetSummary);
        this.reindexAuctionBidHandler.handle(marketplaceReindexState, eventsSetSummary, paymentToken, paymentNonce);
        break;
      }
      case AssetActionEnum.Bought: {
        const [paymentToken, paymentNonce] = await this.getPaymentTokenAndNonce(marketplaceReindexState, eventsSetSummary);
        this.reindexAuctionBoughtHandler.handle(marketplaceReindexState, eventsSetSummary, paymentToken, paymentNonce);
        break;
      }
      case AssetActionEnum.EndedAuction: {
        const [paymentToken] = await this.getPaymentTokenAndNonce(marketplaceReindexState, eventsSetSummary);
        this.reindexAuctionEndedHandler.handle(marketplaceReindexState, eventsSetSummary, paymentToken);
        break;
      }
      case AssetActionEnum.ClosedAuction: {
        this.reindexAuctionClosedHandler.handle(marketplaceReindexState, eventsSetSummary);
        break;
      }
      case AssetActionEnum.PriceUpdated: {
        const [paymentToken] = await this.getPaymentTokenAndNonce(marketplaceReindexState, eventsSetSummary);
        this.reindexAuctionPriceUpdatedHandler.handle(marketplaceReindexState, eventsSetSummary, paymentToken.decimals);
        break;
      }
      case AssetActionEnum.Updated: {
        const [paymentToken] = await this.getPaymentTokenAndNonce(marketplaceReindexState, eventsSetSummary);
        this.reindexAuctionUpdatedHandler.handle(marketplaceReindexState, eventsSetSummary, paymentToken.decimals);
        break;
      }
      case AssetOfferEnum.Created: {
        const [paymentToken] = await this.getPaymentTokenAndNonce(marketplaceReindexState, eventsSetSummary);
        this.reindexOfferCreatedHandler.handle(marketplaceReindexState, eventsSetSummary, paymentToken.decimals);
        break;
      }
      case AssetOfferEnum.Accepted: {
        this.reindexOfferAcceptedHandler.handle(marketplaceReindexState, eventsSetSummary);
        break;
      }
      case AssetOfferEnum.GloballyAccepted: {
        this.reindexGlobalOfferAcceptedHandler.handle(marketplaceReindexState, eventsSetSummary);
        break;
      }
      case AssetOfferEnum.Closed: {
        this.reindexOfferClosedHandler.handle(marketplaceReindexState, eventsSetSummary);
        break;
      }
      default: {
        if (eventsSetSummary.auctionType) {
          throw new Error(`Case not handled ${eventsSetSummary.auctionType}`);
        }
      }
    }
  }

  private async getPaymentTokenAndNonce(marketplaceReindexState: MarketplaceReindexState, input: any): Promise<[Token, number]> {
    try {
      const auction =
        marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
          ? marketplaceReindexState.auctionMap.get(input.auctionId)
          : marketplaceReindexState.auctionMap.get(input.auctionId);
      const paymentNonceValue = input.paymentNonce ?? auction?.paymentNonce;
      const paymentNonce = !Number.isNaN(paymentNonceValue) ? paymentNonceValue : 0;
      const paymentTokenIdentifier = input.paymentToken ?? auction?.paymentToken;
      if (paymentTokenIdentifier === mxConfig.egld) {
        return [
          new Token({
            identifier: mxConfig.egld,
            decimals: mxConfig.decimals,
          }),
          0,
        ];
      }
      if (!paymentTokenIdentifier) {
        return [
          new Token({
            identifier: mxConfig.egld,
            decimals: mxConfig.decimals,
          }),
          paymentNonce,
        ];
      }
      const paymentToken = await this.usdPriceService.getToken(paymentTokenIdentifier);
      if (!paymentToken) {
        return [
          new Token({
            identifier: paymentTokenIdentifier ?? mxConfig.egld,
            decimals: mxConfig.decimals,
          }),
          paymentNonce,
        ];
      }
      return [paymentToken, paymentNonce];
    } catch {
      return [undefined, undefined];
    }
  }

  private async addInactiveStateItemsToDb(marketplaceReindexStates: MarketplaceReindexState[], isFinalBatch?: boolean): Promise<void> {
    try {
      console.log('save to db');
      for (const marketplaceReindexState of marketplaceReindexStates) {
        // marketplaceReindexState.setStateItemsToExpiredIfOlderThanTimestamp(DateUtils.getCurrentTimestamp());

        let [inactiveAuctions, inactiveOffers] = marketplaceReindexState.popAllItems();

        console.log({
          inactiveAuctions: inactiveAuctions.length,
          inactiveordersONAc: inactiveAuctions.sum((au) => au.orders?.length ?? 0),
          inactiveOffers: inactiveOffers?.length,
        });

        if (inactiveAuctions.length === 0 && inactiveOffers.length === 0) {
          continue;
        }

        marketplaceReindexState.isFullStateInMemory = false;

        // await this.populateAuctionMissingAssetTags(inactiveAuctions);

        // for (let i = 0; i < inactiveAuctions.length; i++) {
        //   if (inactiveAuctions[i].id < 0) {
        //     delete inactiveAuctions[i].id;
        //   }
        // }

        await this.auctionSetterService.saveBulkAuctionsOrUpdateAndFillId(inactiveAuctions);

        let tags: TagEntity[] = [];
        inactiveAuctions.map((auction) => {
          const assetTags = auction.tags.split(',');
          assetTags.map((assetTag) => {
            if (assetTag !== '') {
              tags.push(
                new TagEntity({
                  auctionId: auction.id,
                  tag: assetTag.trim().slice(0, constants.dbMaxTagLength),
                  auction: auction,
                }),
              );
            }
          });
        });

        // const saveTagsPromise = this.persistenceService.saveTagsOrIgnore(tags);

        // for (let i = 0; i < inactiveOrders.length; i++) {
        //   if (inactiveOrders[i].auctionId < 0) {
        //     const auctionIndex = inactiveAuctions.findIndex((a) => a.marketplaceAuctionId === -inactiveOrders[i].auctionId);
        //     if (auctionIndex === -1) {
        //       this.logger.warn(
        //         `Auction for ${marketplaceReindexState.marketplace.key} with marketplaceAuctionId ${-inactiveOrders[i]
        //           .auctionId} was not found`,
        //       );
        //       inactiveOrders.splice(i--, 1);
        //       continue;
        //     }
        //     inactiveOrders[i].auction = inactiveAuctions[auctionIndex];
        //     inactiveOrders[i].auctionId = inactiveAuctions[auctionIndex].id;
        //   }
        // }

        inactiveOffers.map((o) => {
          if (o.id < 0) {
            delete o.id;
          }
        });
        console.log({ auctions: inactiveAuctions.length, offers: inactiveOffers.length });

        await Promise.all([
          // saveTagsPromise,
          // this.persistenceService.saveBulkOrdersOrUpdateAndFillId(inactiveOrders),
          this.persistenceService.saveBulkOffersOrUpdateAndFillId(inactiveOffers),
        ]);
      }
    } catch (error) {
      throw error;
    }
  }

  private async populateAuctionMissingAssetTags(auctions: AuctionEntity[]): Promise<void> {
    const batchSize = constants.getNftsFromApiBatchSize;
    for (let i = 0; i < auctions.length; i += batchSize) {
      const assetsWithNoTagsIdentifiers = [
        ...new Set(
          auctions
            .slice(i, i + batchSize)
            .filter((a) => a.tags === '' && a.id < 0)
            .map((a) => a.identifier),
        ),
      ];
      const assets = await this.mxApiService.getNftsByIdentifiers(assetsWithNoTagsIdentifiers, 0, 'fields=identifier,tags');
      for (let j = 0; j < assets?.length; j++) {
        auctions.filter((a) => a.identifier === assets[j].identifier).map((a) => (a.tags = assets[j]?.tags?.join(',') ?? ''));
      }
    }
  }
}
