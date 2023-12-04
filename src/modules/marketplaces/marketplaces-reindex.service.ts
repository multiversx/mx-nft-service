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
import { DateUtils } from 'src/utils/date-utils';
import { Locker } from '@multiversx/sdk-nestjs-common';
import { TagEntity } from 'src/db/auctions/tags.entity';
import { MarketplaceTypeEnum } from './models/MarketplaceType.enum';
import { Token } from '../usdPrice/Token.model';

@Injectable()
export class MarketplacesReindexService {
  constructor(
    private readonly persistenceService: PersistenceService,
    private readonly marketplacesService: MarketplacesService,
    private readonly usdPriceService: UsdPriceService,
    private readonly auctionSetterService: AuctionsSetterService,
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
    await Locker.lock(
      `Reindex marketplace data/state for ${input.marketplaceAddress}`,
      async () => {
        try {
          let marketplaceReindexStates: MarketplaceReindexState[] = await this.getInitialMarketplaceReindexStates(input);

          await this.processMarketplaceEventsInBatches(marketplaceReindexStates, input);

          marketplaceReindexStates.map((s) =>
            s.setStateItemsToExpiredIfOlderThanTimestamp(input.beforeTimestamp ?? DateUtils.getCurrentTimestamp()),
          );

          for (let state of marketplaceReindexStates) {
            await this.populateAuctionAssetTags(state.auctions);
            await this.addMarketplaceStateToDb(state);
          }

          this.logger.log(`Reindexing marketplace data/state for ${input.marketplaceAddress} ended`);
        } catch (error) {
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

  private async processMarketplaceEventsInBatches(
    marketplaceReindexStates: MarketplaceReindexState[],
    input: MarketplaceReindexDataArgs,
  ): Promise<void> {
    let afterTimestamp = input.afterTimestamp;
    let processInNextBatch: MarketplaceEventsEntity[] = [];
    let nextBatchPromise: Promise<MarketplaceEventsEntity[]>;

    nextBatchPromise = this.persistenceService.getMarketplaceEventsAsc(marketplaceReindexStates[0].marketplace.address, afterTimestamp);

    do {
      let batch = await nextBatchPromise;
      if (!batch || batch.length === 0) {
        break;
      }
      [batch, afterTimestamp] = this.getSlicedBatchAndNewestTimestampIfPartialEventsSet(batch, input.beforeTimestamp);

      nextBatchPromise = this.persistenceService.getMarketplaceEventsAsc(marketplaceReindexStates[0].marketplace.address, afterTimestamp);

      processInNextBatch = await this.processEventsBatchAndReturnUnprocessedEvents(
        marketplaceReindexStates,
        processInNextBatch.concat(batch),
      );

      processInNextBatch = await this.processEventsBatchAndReturnUnprocessedEvents(
        marketplaceReindexStates,
        processInNextBatch.concat(batch),
      );

      await this.addInactiveStateItemsToDb(marketplaceReindexStates);
    } while (input.beforeTimestamp ? afterTimestamp < input.beforeTimestamp : true);

    const isFinalBatch = true;
    processInNextBatch = await this.processEventsBatchAndReturnUnprocessedEvents(
      marketplaceReindexStates,
      processInNextBatch,
      isFinalBatch,
    );

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
    let unprocessedEvents: MarketplaceEventsEntity[] = [...batch];

    while (unprocessedEvents.length > 0) {
      const txHash = unprocessedEvents[0].txHash;

      const eventOrdersAndTx = unprocessedEvents.filter((event) => event.txHash === txHash || event.originalTxHash === txHash);

      const isAnotherEventsSetInBatch = unprocessedEvents.find((e) => e.timestamp > unprocessedEvents[0].timestamp);

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

    if (!marketplaceReindexStates[0].isFullStateInMemory) {
      await Promise.all(
        marketplaceReindexStates.map((state) => {
          return this.getStateFromDbIfMissing(state, eventsSetSummaries);
        }),
      );
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
        this.logger.warn(`Error reprocessing marketplace event ${JSON.stringify(eventsSetSummaries[i])} - ${JSON.stringify(error)}`);
      }
    }
  }

  private async getStateFromDbIfMissing(marketplaceReindexState: MarketplaceReindexState, eventsSetSummaries: any[]): Promise<void> {
    const [missingAuctionIds, missingOfferIds, missingStateForIdentifiers] = this.getMissingStateIds(
      marketplaceReindexState,
      eventsSetSummaries,
    );

    let auctions: AuctionEntity[];
    if (missingAuctionIds.length > 0) {
      auctions = await this.persistenceService.getBulkAuctionsByAuctionIdsAndMarketplace(
        missingAuctionIds,
        marketplaceReindexState.marketplace.key,
      );
    } else if (missingStateForIdentifiers.length > 0) {
      auctions = await this.persistenceService.getBulkAuctionsByIdentifierAndMarketplace(
        missingStateForIdentifiers,
        marketplaceReindexState.marketplace.key,
      );
    }

    const auctionIds = auctions?.map((a) => a.id);
    const [orders, offers] = await Promise.all([
      auctionIds?.length > 0 ? this.persistenceService.getOrdersByAuctionIds(auctionIds) : [],
      missingOfferIds?.length > 0
        ? this.persistenceService.getBulkOffersByOfferIdsAndMarketplace(missingOfferIds, marketplaceReindexState.marketplace.key)
        : [],
    ]);

    if (orders?.length > 0) {
      marketplaceReindexState.orders = marketplaceReindexState.orders.concat(orders);
    }
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

      if (eventsSetSummaries[i].auctionId && eventsSetSummaries[i].action !== AssetActionEnum.StartedAuction) {
        const auctionIndex =
          marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
            ? marketplaceReindexState.getAuctionIndexByAuctionId(eventsSetSummaries[i].auctionId)
            : marketplaceReindexState.getAuctionIndexByIdentifier(eventsSetSummaries[i].identifier);
        if (auctionIndex === -1) {
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
        const paymentToken = await this.usdPriceService.getToken(eventsSetSummary.paymentToken);
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
      const auctionIndex =
        marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
          ? marketplaceReindexState.getAuctionIndexByAuctionId(input.auctionId)
          : marketplaceReindexState.getAuctionIndexByIdentifier(input.identifier);
      const paymentNonceValue = input.paymentNonce ?? marketplaceReindexState.auctions[auctionIndex]?.paymentNonce;
      const paymentNonce = !Number.isNaN(paymentNonceValue) ? paymentNonceValue : 0;
      const paymentTokenIdentifier = input.paymentToken ?? marketplaceReindexState.auctions[auctionIndex]?.paymentToken;
      if (paymentTokenIdentifier === mxConfig.egld) {
        return [
          new Token({
            identifier: mxConfig.egld,
            decimals: mxConfig.decimals,
          }),
          0,
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

  private async addInactiveStateItemsToDb(marketplaceReindexStates: MarketplaceReindexState[]): Promise<void> {
    for (const marketplaceReindexState of marketplaceReindexStates) {
      marketplaceReindexState.setStateItemsToExpiredIfOlderThanTimestamp(DateUtils.getCurrentTimestamp());

      const [inactiveAuctions, inactiveOrders, inactiveOffers] = marketplaceReindexState.popInactiveItems();

      await this.populateAuctionAssetTags(inactiveAuctions);

      for (let i = 0; i < inactiveOrders.length; i++) {
        inactiveOrders[i].auctionId = inactiveAuctions.findIndex((a) => a.id === inactiveOrders[i].auctionId);
        delete inactiveOrders[i].id;
      }

      for (let i = 0; i < inactiveAuctions.length; i++) {
        delete inactiveAuctions[i].id;
      }

      await this.auctionSetterService.saveBulkAuctions(inactiveAuctions);

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

      const saveTagsPromise = this.persistenceService.saveTags(tags);

      for (let i = 0; i < inactiveOrders.length; i++) {
        inactiveOrders[i].auction = inactiveAuctions[inactiveOrders[i].auctionId];
        inactiveOrders[i].auctionId = inactiveAuctions[inactiveOrders[i].auctionId].id;
      }
      inactiveOffers.map((o) => delete o.id);

      await Promise.all([
        saveTagsPromise,
        this.persistenceService.saveBulkOrders(inactiveOrders),
        this.persistenceService.saveBulkOffers(inactiveOffers),
      ]);
    }
  }

  private async addMarketplaceStateToDb(marketplaceReindexState: MarketplaceReindexState): Promise<void> {
    marketplaceReindexState.auctions.map((a) => {
      delete a.id;
    });
    marketplaceReindexState.orders.map((o) => delete o.id);
    marketplaceReindexState.offers.map((o) => delete o.id);

    await this.auctionSetterService.saveBulkAuctions(marketplaceReindexState.auctions);

    for (let i = 0; i < marketplaceReindexState.orders.length; i++) {
      marketplaceReindexState.orders[i].auction = marketplaceReindexState.auctions[marketplaceReindexState.orders[i].auctionId];
      marketplaceReindexState.orders[i].auctionId = marketplaceReindexState.auctions[marketplaceReindexState.orders[i].auctionId].id;
    }

    let tags: TagEntity[] = [];
    marketplaceReindexState.auctions.map((auction) => {
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

    await Promise.all([
      this.persistenceService.saveBulkOrders(marketplaceReindexState.orders),
      this.persistenceService.saveBulkOffers(marketplaceReindexState.offers),
      this.persistenceService.saveTags(tags),
    ]);
  }

  private async populateAuctionAssetTags(auctions: AuctionEntity[]): Promise<void> {
    const batchSize = constants.getNftsFromApiBatchSize;
    for (let i = 0; i < auctions.length; i += batchSize) {
      const assetsWithNoTagsIdentifiers = [
        ...new Set(
          auctions
            .slice(i, i + batchSize)
            .filter((a) => a.tags === '')
            .map((a) => a.identifier),
        ),
      ];
      const assets = await this.mxApiService.getNftsByIdentifiers(assetsWithNoTagsIdentifiers, 0, 'fields=identifier,tags');
      const tags = assets.filter((a) => a.tags);
      for (let j = 0; j < assets?.length; j++) {
        auctions.filter((a) => a.identifier === assets[j].identifier).map((a) => (a.tags = assets[j]?.tags?.join(',') ?? ''));
      }
    }
  }
}
