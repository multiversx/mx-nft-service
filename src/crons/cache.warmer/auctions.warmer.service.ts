import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Locker } from 'src/utils/locker';
import { cacheConfig } from 'src/config';
import { ClientProxy } from '@nestjs/microservices';
import { CachingService } from 'src/common/services/caching/caching.service';
import { TimeConstants } from 'src/utils/time-utils';
import { AuctionsGetterService } from 'src/modules/auctions';
import { DateUtils } from 'src/utils/date-utils';
import { QueryRequest } from 'src/modules/common/filters/QueryRequest';
import {
  Filter,
  FiltersExpression,
  GroupBy,
  Grouping,
  Operation,
  Operator,
} from 'src/modules/common/filters/filtersTypes';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';

@Injectable()
export class AuctionsWarmerService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private auctionsGetterService: AuctionsGetterService,
    private cacheService: CachingService,
    private marketplacesService: MarketplacesService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.auctionsRedisClientName,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAuctionsEndingInAMonth() {
    await Locker.lock(
      'Auctions tokens ending in a month invalidations',
      async () => {
        const tokens =
          await this.auctionsGetterService.getRunningAuctionsEndingBefore(
            DateUtils.getCurrentTimestampPlusDays(30),
          );
        await this.invalidateKey(
          CacheInfo.AuctionsEndingInAMonth.key,
          tokens,
          3 * TimeConstants.oneMinute,
        );
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCachingForFeaturedCollections() {
    await Locker.lock(
      'Featured collection auctions',
      async () => {
        const collections =
          await this.marketplacesService.getAllCollectionsIdentifiersFromDb();

        for (const collection of collections) {
          const queryRequest = new QueryRequest({
            customFilters: [],
            offset: 0,
            limit: 10000,
            filters: new FiltersExpression({
              filters: [
                new Filter({
                  field: 'status',
                  values: ['Running'],
                  op: Operation.EQ,
                }),
                new Filter({
                  field: 'tags',
                  values: [null],
                  op: Operation.LIKE,
                }),
                new Filter({
                  field: 'startDate',
                  values: [Math.round(new Date().getTime() / 1000).toString()],
                  op: Operation.LE,
                }),
                new Filter({
                  field: 'collection',
                  values: [collection],
                  op: Operation.EQ,
                }),
              ],
              operator: Operator.AND,
            }),
            groupByOption: new Grouping({
              groupBy: GroupBy.IDENTIFIER,
            }),
            sorting: [],
          });

          const auctionResult =
            await this.auctionsGetterService.getAuctionsGroupByIdentifierRaw(
              queryRequest,
            );
          await this.invalidateKey(
            `collectionAuctions:${collection}`,
            auctionResult,
            10 * TimeConstants.oneMinute,
          );
        }
      },
      true,
    );
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  // async handleMarketplaceAuctions() {
  //   await Locker.lock(
  //     'Marketplace Auctions invalidations',
  //     async () => {
  //       const tokens =
  //         await this.auctionsGetterService.getMarketplaceAuctionsQuery(
  //           DateUtils.getCurrentTimestamp(),
  //         );
  //       await this.invalidateKey(
  //         CacheInfo.MarketplaceAuctions.key,
  //         tokens,
  //         3 * TimeConstants.oneMinute,
  //       );
  //     },
  //     true,
  //   );
  // }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cacheService.setCache(this.redisClient, key, data, ttl);
    await this.refreshCacheKey(key, ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    await this.clientProxy.emit('refreshCacheKey', {
      key,
      ttl,
      redisClientName: cacheConfig.auctionsRedisClientName,
    });
  }
}
