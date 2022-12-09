import { Injectable } from '@nestjs/common';
import { ElrondElasticService } from 'src/common';
import { constants, elrondConfig } from 'src/config';
import {
  AuctionEventEnum,
  ElrondNftsSwapAuctionEventEnum,
  ExternalAuctionEventEnum,
  NftEventEnum,
  Price,
  NftEventTypeEnum,
} from '../assets/models';
import { AssetHistoryLog } from './models';
import BigNumber from 'bignumber.js';
import { AssetsHistoryAuctionService } from './services/assets-history.auction.service';
import { AssetHistoryInput } from './models/asset-history-log-input';
import { AssetsHistoryExternalAuctionService } from './services/assets-history.external-auction.service';
import { AssetsHistoryNftEventService } from './services/assets-history.nft-events.service';
import { AssetsHistoryElrondNftsSwapEventsService } from './services/assets-history.nfts-swap-auction.service';
import { AssetsHistoryCachingService } from './assets-history-caching.service';
import {
  ElasticQuery,
  ElasticSortOrder,
  QueryType,
  RangeLowerThan,
} from '@elrondnetwork/erdnest';

@Injectable()
export class AssetsHistoryService {
  constructor(
    private readonly elrondElasticService: ElrondElasticService,
    private readonly assetsHistoryNftEventService: AssetsHistoryNftEventService,
    private readonly assetsHistoryAuctionService: AssetsHistoryAuctionService,
    private readonly assetsHistoryExternalAuctionService: AssetsHistoryExternalAuctionService,
    private readonly assetsHistoryElrondNftsSwapEventsService: AssetsHistoryElrondNftsSwapEventsService,
    private readonly assetsHistoryCachingService: AssetsHistoryCachingService,
  ) {}

  async getOrSetHistoryLog(
    collection: string,
    nonce: string,
    limit: number,
    beforeTimestamp: number,
  ): Promise<AssetHistoryLog[]> {
    const getOrSetHistoryLog = async () =>
      await this.getHistoryLog(collection, nonce, limit, beforeTimestamp);
    return await this.assetsHistoryCachingService.getOrSetHistoryLog(
      collection,
      nonce,
      limit,
      beforeTimestamp,
      getOrSetHistoryLog,
    );
  }

  private async getHistoryLog(
    collection: string,
    nonce: string,
    limit: number,
    beforeTimestamp: number,
    historyLog: AssetHistoryLog[] = [],
  ): Promise<AssetHistoryLog[]> {
    let elasticLogs = [];
    const encodedCollection = Buffer.from(collection).toString('base64');
    const encodedNonce = Buffer.from(nonce, 'hex').toString('base64');

    const query = ElasticQuery.create()
      .withMustCondition(
        QueryType.Nested('events', {
          'events.topics': encodedCollection,
        }),
      )
      .withMustCondition(
        QueryType.Nested('events', {
          'events.topics': encodedNonce,
        }),
      )
      .withRangeFilter('timestamp', new RangeLowerThan(beforeTimestamp))
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withPagination({
        from: 0,
        size: constants.getLogsFromElasticBatchSize,
      });

    await this.elrondElasticService.getScrollableList(
      'logs',
      'identifier',
      query,
      async (logs) => {
        for (let i = 0; i < logs.length; i++) {
          for (let j = 0; j < logs[i].events.length; j++) {
            if (
              logs[i].events[j].topics?.[0] === encodedCollection &&
              logs[i].events[j].topics?.[1] === encodedNonce
            ) {
              elasticLogs.push(logs[i]);
            }
          }
        }

        if (elasticLogs.length >= limit) {
          return false;
        }
      },
    );

    elasticLogs = [...new Set(elasticLogs)];

    for (let index = 0; index < elasticLogs.length; index++) {
      if (historyLog.length === limit) {
        break;
      } else {
        this.mapLogs(nonce, elasticLogs, index, historyLog);
      }
    }

    return historyLog;
  }

  private mapLogs(
    nonce: string,
    res: any,
    index: number,
    historyLog: AssetHistoryLog[],
  ) {
    const [eventCategory, eventType, mainEvent] = this.getEventType(res, index);

    if (!eventCategory) {
      return;
    }

    switch (eventCategory) {
      case NftEventTypeEnum.NftEventEnum: {
        this.addHistoryLog(
          historyLog,
          this.assetsHistoryNftEventService.mapNftEventLog(
            nonce,
            eventType,
            mainEvent,
          ),
        );
        break;
      }
      case NftEventTypeEnum.AuctionEventEnum: {
        this.addHistoryLog(
          historyLog,
          this.assetsHistoryAuctionService.mapAuctionEventLog(
            eventType,
            mainEvent,
          ),
        );
        break;
      }
      case NftEventTypeEnum.ExternalAuctionEventEnum: {
        this.addHistoryLog(
          historyLog,
          this.assetsHistoryExternalAuctionService.mapExternalAuctionEventLog(
            nonce,
            eventType,
            mainEvent,
          ),
        );
        break;
      }
      case NftEventTypeEnum.ElrondNftsSwapAuctionEventEnum: {
        this.addHistoryLog(
          historyLog,
          this.assetsHistoryElrondNftsSwapEventsService.mapElrondNftsSwapEventLog(
            eventType,
            mainEvent,
          ),
        );
        break;
      }
    }
  }

  private addHistoryLog(
    historyLog: AssetHistoryLog[],
    input: AssetHistoryInput,
  ): void {
    if (!input) {
      return;
    }

    const minPrice = input.price
      ? Buffer.from(input.price, 'base64')
          .toString('hex')
          .hexBigNumberToString()
      : undefined;
    const itemCountString = input.itemsCount
      ? Buffer.from(input.itemsCount, 'base64')
          .toString('hex')
          .hexBigNumberToString()
      : undefined;
    const totalPrice =
      minPrice && itemCountString
        ? new BigNumber(minPrice).multipliedBy(itemCountString)
        : undefined;

    historyLog.push(
      new AssetHistoryLog({
        action: input.action,
        address: input.address,
        senderAddress: input.sender,
        transactionHash: input.event.originalTxHash
          ? input.event.originalTxHash
          : input.event.identifier,
        actionDate: input.event.timestamp || '',
        itemCount: itemCountString ? itemCountString.toString() : undefined,
        price: totalPrice
          ? new Price({
              nonce: 0,
              token: elrondConfig.egld,
              amount: totalPrice.toFixed(),
              timestamp: input.event.timestamp,
            })
          : undefined,
      }),
    );
  }

  private getEventType(res: any, index: number): [string, string, any] {
    if (res[index].originalTxHash) {
      return [undefined, undefined, undefined];
    }

    const eventId = res[index].identifier;

    const relatedEvents = res.filter(
      (eventObject) =>
        eventObject.identifier === eventId ||
        eventObject.originalTxHash === eventId,
    );

    for (let i = 0; i < relatedEvents?.length; i++) {
      const events = relatedEvents[i].events;

      for (let j = 0; j < events.length; j++) {
        const eventIdentifier = events[j].identifier;
        if (
          eventIdentifier !== NftEventEnum.ESDTNFTTransfer &&
          eventIdentifier !== NftEventEnum.MultiESDTNFTTransfer &&
          Object.values(NftEventEnum).includes(eventIdentifier)
        ) {
          return [
            NftEventTypeEnum.NftEventEnum,
            eventIdentifier,
            relatedEvents[i],
          ];
        }
        if (Object.values(AuctionEventEnum).includes(eventIdentifier)) {
          return [
            NftEventTypeEnum.AuctionEventEnum,
            eventIdentifier,
            relatedEvents[i],
          ];
        }
        if (Object.values(ExternalAuctionEventEnum).includes(eventIdentifier)) {
          return [
            NftEventTypeEnum.ExternalAuctionEventEnum,
            eventIdentifier,
            relatedEvents[i],
          ];
        }
        if (
          Object.values(ElrondNftsSwapAuctionEventEnum).includes(
            eventIdentifier,
          )
        ) {
          return [
            NftEventTypeEnum.ElrondNftsSwapAuctionEventEnum,
            eventIdentifier,
            relatedEvents[i],
          ];
        }
      }
    }

    return [
      NftEventTypeEnum.NftEventEnum,
      res[index].events[0].identifier,
      res[index],
    ];
  }
}
