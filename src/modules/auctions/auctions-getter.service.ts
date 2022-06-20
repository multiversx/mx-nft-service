import { Inject, Injectable } from '@nestjs/common';
import { Auction } from './models';
import '../../utils/extentions';
import { AuctionEntity } from 'src/db/auctions';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { cacheConfig } from 'src/config';
import { RedisCacheService } from 'src/common';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';
import { QueryRequest } from '../common/filters/QueryRequest';
import { GroupBy, Operation } from '../common/filters/filtersTypes';
import { TimeConstants } from 'src/utils/time-utils';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { DateUtils } from 'src/utils/date-utils';
import {
  AuctionWithBidsCount,
  AuctionWithStartBid,
} from 'src/db/auctions/auctionWithBidCount.dto';
import { CachingService } from 'src/common/services/caching/caching.service';
const hash = require('object-hash');

@Injectable()
export class AuctionsGetterService {
  private redisClient: Redis.Redis;
  constructor(
    private auctionServiceDb: AuctionsServiceDb,
    private cacheService: CachingService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.auctionsRedisClientName,
    );
  }

  async getAuctions(queryRequest: QueryRequest): Promise<[Auction[], number]> {
    try {
      if (this.filtersForMarketplaceAuctions(queryRequest)) {
        return await this.getMarketplaceAuctions(queryRequest);
      }
      return this.redisCacheService.getOrSet(
        this.redisClient,
        this.getAuctionsCacheKey(queryRequest),
        () => this.getMappedAuctions(queryRequest),
        30 * TimeConstants.oneSecond,
      );
    } catch (error) {
      this.logger.error('An error occurred while get auctions', {
        path: 'AuctionsService.getAuctions',
        queryRequest,
        exception: error,
      });
    }
  }

  async getAuctionsOrderByNoBids(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number]> {
    try {
      if (this.filtersForRunningAndEndDate(queryRequest)) {
        return await this.getEndingAuctions(queryRequest);
      }

      return this.redisCacheService.getOrSet(
        this.redisClient,
        this.getAuctionsCacheKey(queryRequest),
        async () => this.getMappedAuctionsOrderBids(queryRequest),
        TimeConstants.oneHour,
      );
    } catch (error) {
      this.logger.error(
        'An error occurred while get auctions order by number of bids',
        {
          path: 'AuctionsService.getAuctionsOrderByNoBids',
          queryRequest,
          exception: error,
        },
      );
    }
  }

  async getClaimableAuctions(
    limit: number = 10,
    offset: number = 0,
    address: string,
  ): Promise<[Auction[], number]> {
    try {
      const cacheKey = this.getClaimableAuctionsCacheKey(
        address,
        limit,
        offset,
      );
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getMappedClaimableAuctions(limit, offset, address),
        30 * TimeConstants.oneSecond,
      );
    } catch (error) {
      this.logger.error('An error occurred while get auctions', {
        path: 'AuctionsService.getClaimableAuctions',
        address,
        exception: error,
      });
    }
  }

  public async getRunningAuctionsEndingBefore(
    endDate: number,
  ): Promise<[AuctionWithBidsCount[], number]> {
    let auctions: AuctionWithBidsCount[] =
      await this.auctionServiceDb.getAuctionsEndingBefore(endDate);
    auctions = auctions?.map((item) => new AuctionWithBidsCount(item));

    const group: { key: string; value: AuctionWithBidsCount[] } =
      auctions?.groupBy((a) => a.identifier);
    let groupedAuctions = [];
    for (const key in group) {
      groupedAuctions = [
        ...groupedAuctions,
        group[key].sortedDescending(
          (i: { ordersCount: any }) => i.ordersCount,
        )[0],
      ];
    }

    groupedAuctions = groupedAuctions?.sortedDescending((a) => a.ordersCount);
    return [groupedAuctions, groupedAuctions?.length];
  }

  public async getMarketplaceAuctionsQuery(
    startDate: number,
  ): Promise<[AuctionWithStartBid[], number]> {
    let auctions: AuctionWithStartBid[] =
      await this.auctionServiceDb.getAuctionsForMarketplace(startDate);
    auctions = auctions?.map((item) => new AuctionWithStartBid(item));

    const group: { key: string; value: AuctionWithBidsCount[] } =
      auctions?.groupBy((a) => a.identifier);
    let groupedAuctions = [];
    for (const key in group) {
      groupedAuctions = [
        ...groupedAuctions,
        group[key].sortedDescending((i: { startBid: any }) => i.startBid)[0],
      ];
    }

    groupedAuctions = groupedAuctions?.sortedDescending((a) => a.creationDate);
    return [groupedAuctions, groupedAuctions?.length];
  }

  async getAuctionsThatReachedDeadline(): Promise<AuctionEntity[]> {
    return await this.auctionServiceDb.getAuctionsThatReachedDeadline();
  }

  async getAuctionById(id: number): Promise<AuctionEntity> {
    return await this.auctionServiceDb.getAuction(id);
  }

  async getAvailableTokens(id: number): Promise<number> {
    return await this.auctionServiceDb.getAvailableTokens(id);
  }

  async getMinMaxPrice(): Promise<{ minBid: string; maxBid: string }> {
    try {
      return this.redisCacheService.getOrSet(
        this.redisClient,
        generateCacheKeyFromParams('minMaxPrice'),
        () => this.auctionServiceDb.getMinMax(),
        5 * TimeConstants.oneMinute,
      );
    } catch (error) {
      this.logger.error('An error occurred while getting min max price', {
        path: 'AuctionsService.getMinMaxPrice',
        exception: error,
      });
    }
  }

  public async invalidateCache(address: string) {
    await this.redisCacheService.delByPattern(
      this.redisClient,
      generateCacheKeyFromParams('claimable_auctions', address),
    );
  }

  private filtersForRunningAndEndDate(queryRequest: QueryRequest) {
    return (
      queryRequest?.filters?.filters?.length === 2 &&
      queryRequest.filters.filters.filter(
        (item) =>
          item.field === 'status' ||
          item.field === 'endDate' ||
          item.field === 'startDate',
      ).length === 3 &&
      queryRequest.filters.filters.find(
        (f) =>
          f.field === 'endDate' &&
          f.values.length === 1 &&
          parseInt(f.values[0]) < DateUtils.getCurrentTimestampPlusDays(30),
      )
    );
  }

  private filtersForMarketplaceAuctions(queryRequest: QueryRequest) {
    return (
      ((queryRequest?.filters?.filters?.length === 2 &&
        queryRequest.filters.filters.filter(
          (item) => item.field === 'status' || item.field === 'startDate',
        ).length === 2) ||
        (queryRequest?.filters?.filters?.length === 3 &&
          queryRequest.filters.filters.filter(
            (item) =>
              item.field === 'status' ||
              item.field === 'startDate' ||
              item.field === 'tags',
          ).length === 3)) &&
      !queryRequest.customFilters
    );
  }

  private async getMarketplaceAuctions(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number]> {
    let [auctions, count] = await this.getMarketplaceAuctionsMap();
    auctions = auctions.filter(
      (a) => a.endDate > DateUtils.getCurrentTimestamp(),
    );
    const tagsFilter = queryRequest.filters.filters.filter(
      (item) => item.field === 'tags',
    );
    if (tagsFilter && tagsFilter[0]?.values?.length > 0) {
      auctions = auctions.filter((a) =>
        tagsFilter[0].values.every((tag) => a.tags.includes(tag)),
      );
    }
    count = auctions.length;
    auctions = auctions?.slice(
      queryRequest.offset,
      queryRequest.offset + queryRequest.limit,
    );

    return [auctions?.map((item) => Auction.fromEntity(item)), count];
  }

  private async getEndingAuctions(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number]> {
    if (
      queryRequest.filters.filters.find(
        (f) =>
          f.field === 'endDate' &&
          f.values.length === 1 &&
          parseInt(f.values[0]) < DateUtils.getCurrentTimestampPlusMinute(10),
      )
    ) {
      let [auctions, count] = await this.getAuctionsToday();
      auctions = auctions.filter(
        (a) => a.endDate > DateUtils.getCurrentTimestamp(),
      );
      count = auctions.length;
      auctions = auctions?.slice(
        queryRequest.offset,
        queryRequest.offset + queryRequest.limit,
      );

      return [auctions?.map((item) => Auction.fromEntity(item)), count];
    }
    let [auctions, count] = await this.getAuctionsEndingInAMonth();
    auctions = auctions.filter(
      (a) => a.endDate > DateUtils.getCurrentTimestamp(),
    );
    auctions = auctions?.slice(
      queryRequest.offset,
      queryRequest.offset + queryRequest.limit,
    );

    return [auctions?.map((item) => Auction.fromEntity(item)), count];
  }

  private async getAuctionsToday(): Promise<[AuctionWithBidsCount[], number]> {
    return this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.AuctionsEndingToday.key,
      () =>
        this.getRunningAuctionsEndingBefore(
          DateUtils.getCurrentTimestampPlus(24),
        ),
      TimeConstants.oneHour,
    );
  }

  private async getMarketplaceAuctionsMap(): Promise<
    [AuctionWithStartBid[], number]
  > {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.MarketplaceAuctions.key,
      () => this.getMarketplaceAuctionsQuery(DateUtils.getCurrentTimestamp()),
      5 * TimeConstants.oneMinute,
    );
  }

  private async getAuctionsEndingInAMonth(): Promise<
    [AuctionWithBidsCount[], number]
  > {
    return await this.redisCacheService.getOrSet(
      this.redisClient,
      CacheInfo.AuctionsEndingInAMonth.key,
      () =>
        this.getRunningAuctionsEndingBefore(
          DateUtils.getCurrentTimestampPlusDays(30),
        ),
      TimeConstants.oneHour,
    );
  }

  private async getMappedClaimableAuctions(
    limit: number = 10,
    offset: number = 0,
    address: string,
  ) {
    const [auctions, count] = await this.auctionServiceDb.getClaimableAuctions(
      limit,
      offset,
      address,
    );

    return [auctions?.map((element) => Auction.fromEntity(element)), count];
  }

  private async getMappedAuctions(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number]> {
    if (this.filtersByIdentifier(queryRequest)) {
      return await this.getAuctionsForIdentifier(queryRequest);
    }
    const [auctions, count] = await this.auctionServiceDb.getAuctionsGroupBy(
      queryRequest,
    );
    return [auctions?.map((element) => Auction.fromEntity(element)), count];
  }

  private filtersByIdentifier(queryRequest: QueryRequest) {
    return queryRequest?.filters?.filters?.some(
      (f) => f.field === 'identifier' && f.op === Operation.EQ,
    );
  }

  private async getAuctionsForIdentifier(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number]> {
    const [auctions, count] =
      await this.auctionServiceDb.getAuctionsForIdentifier(queryRequest);
    return [auctions?.map((element) => Auction.fromEntity(element)), count];
  }

  private async getMappedAuctionsOrderBids(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number]> {
    let [auctions, count] = [[], 0];
    [auctions, count] =
      await this.auctionServiceDb.getAuctionsOrderByOrdersCountGroupByIdentifier(
        queryRequest,
      );

    return [auctions?.map((element) => Auction.fromEntity(element)), count];
  }

  private getAuctionsCacheKey(request: any) {
    return generateCacheKeyFromParams('auctions', hash(request));
  }

  private getClaimableAuctionsCacheKey(
    address: string,
    limit: number,
    offset: number,
  ) {
    return generateCacheKeyFromParams(
      'claimable_auctions',
      address,
      limit,
      offset,
    );
  }
}
