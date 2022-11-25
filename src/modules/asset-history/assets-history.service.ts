import { Injectable } from '@nestjs/common';
import { ElrondElasticService, RedisCacheService } from 'src/common';
import { cacheConfig, elrondConfig } from 'src/config';
import {
  AuctionEventEnum,
  ElrondNftsSwapAuctionEventEnum,
  ExternalAuctionEventEnum,
  NftEventEnum,
  StakeNftEventsEnum,
  Price,
  NftEventTypeEnum,
} from '../assets/models';
import { AssetHistoryLog } from './models';
import BigNumber from 'bignumber.js';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { AssetsHistoryAuctionService } from './services/assets-history.auction.service';
import { AssetHistoryInput } from './models/asset-history-log-input';
import { AssetsHistoryExternalAuctionService } from './services/assets-history.external-auction.service';
import { AssetsHistoryNftEventService } from './services/assets-history.nft-events.service';
import { AssetsHistoryElrondNftsSwapEventsService } from './services/assets-history.nfts-swap-auction.service';
import { AssetsHistoryStakeEventsService } from './services/assets-history.stake.service';

@Injectable()
export class AssetsHistoryService {
  private redisClient: Redis.Redis;

  constructor(
    private readonly elasticService: ElrondElasticService,
    private readonly redisCacheService: RedisCacheService,
    private readonly assetsHistoryNftEventService: AssetsHistoryNftEventService,
    private readonly assetsHistoryAuctionService: AssetsHistoryAuctionService,
    private readonly assetsHistoryExternalAuctionService: AssetsHistoryExternalAuctionService,
    private readonly assetsHistoryElrondNftsSwapEventsService: AssetsHistoryElrondNftsSwapEventsService,
    private readonly assetsHistoryStakeEventsService: AssetsHistoryStakeEventsService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getOrSetHistoryLog(
    collection: string,
    nonce: string,
    limit: number,
    timestamp: string | number, // = DateUtils.getCurrentTimestamp(),
  ): Promise<AssetHistoryLog[]> {
    const cacheKey = this.getAssetHistoryCacheKey(
      collection,
      nonce,
      limit,
      timestamp,
    );
    const getOrSetHistoryLog = async () =>
      await this.getHistoryLog(collection, nonce, limit, timestamp);
    return await this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getOrSetHistoryLog,
      CacheInfo.AssetHistory.ttl,
    );
  }

  private async getHistoryLog(
    collection: string,
    nonce: string,
    limit: number,
    timestamp: string | number,
    historyLog: AssetHistoryLog[] = [],
  ): Promise<AssetHistoryLog[]> {
    let elasticLogs = [];
    let totalHits = 0;
    let elasticTimestamp = 0;

    [elasticLogs, totalHits, elasticTimestamp] =
      await this.elasticService.getNftHistory(
        Buffer.from(collection).toString('base64'),
        Buffer.from(nonce, 'hex').toString('base64'),
        limit,
        timestamp,
      );

    for (let index = 0; index < elasticLogs.length; index++) {
      if (historyLog.length === limit) {
        break;
      } else {
        this.mapLogs(nonce, elasticLogs, index, historyLog);
      }
    }

    if (historyLog.length < limit && totalHits > 0) {
      return await this.getHistoryLog(
        collection,
        nonce,
        limit,
        elasticTimestamp,
        historyLog,
      );
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
      case NftEventTypeEnum.StakeNftEventsEnum: {
        this.addHistoryLog(
          historyLog,
          this.assetsHistoryStakeEventsService.mapStakeEventLog(
            nonce,
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
        transactionHash: input.event._source.originalTxHash
          ? input.event._source.originalTxHash
          : input.event._id,
        actionDate: input.event._source.timestamp || '',
        itemCount: itemCountString ? itemCountString.toString() : undefined,
        price: totalPrice
          ? new Price({
              nonce: 0,
              token: elrondConfig.egld,
              amount: totalPrice.toFixed(),
              timestamp: input.event._source.timestamp,
            })
          : undefined,
      }),
    );
  }

  private getEventType(res: any, index: number): [string, string, any] {
    if (res[index]._source.originalTxHash) {
      return [undefined, undefined, undefined];
    }

    const eventId = res[index]._id;

    const relatedEvents = res.filter(
      (eventObject) =>
        eventObject._id === eventId ||
        eventObject._source.originalTxHash === eventId,
    );

    for (let i = 0; i < relatedEvents?.length; i++) {
      const events = relatedEvents[i]._source.events;

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
        if (Object.values(StakeNftEventsEnum).includes(eventIdentifier)) {
          return [
            NftEventTypeEnum.StakeNftEventsEnum,
            eventIdentifier,
            relatedEvents[i],
          ];
        }
      }
    }

    return [
      NftEventTypeEnum.NftEventEnum,
      res[index]._source.events[0].identifier,
      res[index],
    ];
  }

  private getAssetHistoryCacheKey(
    collection: string,
    nonce: string,
    limit?: number,
    timestamp?: string | number,
  ) {
    return generateCacheKeyFromParams(
      CacheInfo.AssetHistory.key,
      collection,
      nonce,
      limit,
      timestamp,
    );
  }
}
