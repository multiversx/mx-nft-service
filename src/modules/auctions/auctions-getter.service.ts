import { Inject, Injectable } from '@nestjs/common';
import { Auction } from './models';
import '../../utils/extentions';
import { AuctionEntity } from 'src/db/auctions';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as Redis from 'ioredis';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';
import { QueryRequest } from '../common/filters/QueryRequest';
import { GroupBy, Operation, Sort } from '../common/filters/filtersTypes';
import { TimeConstants } from 'src/utils/time-utils';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { DateUtils } from 'src/utils/date-utils';
import {
  AuctionWithBidsCount,
  AuctionWithStartBid,
} from 'src/db/auctions/auctionWithBidCount.dto';
import { CachingService } from 'src/common/services/caching/caching.service';
import { PriceRange } from 'src/db/auctions/price-range';
import { AuctionsCachingService } from './caching/auctions-caching.service';
import { Constants, RedisCacheService } from '@elrondnetwork/erdnest';
import { cacheConfig } from 'src/config';

@Injectable()
export class AuctionsGetterService {
  private redisClient: Redis.Redis;
  constructor(
    private auctionServiceDb: AuctionsServiceDb,
    private auctionCachiungService: AuctionsCachingService,
    private cacheService: CachingService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getAuctions(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    try {
      // if (this.filtersForMarketplaceAuctions(queryRequest)) {
      //   return await this.getMarketplaceAuctions(queryRequest);
      // }

      return await this.auctionCachiungService.getOrSetAuctions(
        queryRequest,
        () => this.getMappedAuctions(queryRequest),
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
  ): Promise<[Auction[], number, PriceRange]> {
    try {
      if (this.filtersForRunningAndEndDate(queryRequest)) {
        return await this.getEndingAuctions(queryRequest);
      }

      return await this.auctionCachiungService.getAuctionsOrderByNoBids(
        queryRequest,
        async () => this.getMappedAuctionsOrderBids(queryRequest),
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
    marketplaceKey: string,
  ): Promise<[Auction[], number]> {
    const key: string = marketplaceKey
      ? `${address}_${marketplaceKey}`
      : address;
    try {
      return await this.auctionCachiungService.getClaimableAuctions(
        limit,
        offset,
        key,
        () =>
          this.getMappedClaimableAuctions(
            limit,
            offset,
            address,
            marketplaceKey,
          ),
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
  ): Promise<[AuctionWithBidsCount[], number, PriceRange]> {
    let [auctions, priceRange] =
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
    return [groupedAuctions, groupedAuctions?.length, priceRange];
  }

  public async getMarketplaceAuctionsQuery(
    startDate: number,
  ): Promise<[AuctionWithStartBid[], number, PriceRange]> {
    let [auctions, priceRange] =
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
    return [groupedAuctions, groupedAuctions?.length, priceRange];
  }

  async getAuctionsThatReachedDeadline(): Promise<AuctionEntity[]> {
    return await this.auctionServiceDb.getAuctionsThatReachedDeadline();
  }

  async getAuctionById(id: number): Promise<AuctionEntity> {
    return await this.auctionServiceDb.getAuction(id);
  }

  async getAuctionByIdAndMarketplace(
    id: number,
    marketplaceKey: string,
  ): Promise<AuctionEntity> {
    return await this.auctionServiceDb.getAuctionByMarketplace(
      id,
      marketplaceKey,
    );
  }

  async getAvailableTokens(
    id: number,
    marketplaceKey: string,
  ): Promise<number> {
    return await this.auctionServiceDb.getAvailableTokensForSpecificMarketplace(
      id,
      marketplaceKey,
    );
  }

  async getMinMaxPrice(
    token: string,
  ): Promise<{ minBid: string; maxBid: string }> {
    try {
      return await this.auctionCachiungService.getMinAndMax(() =>
        this.auctionServiceDb.getMinMax(token),
      );
    } catch (error) {
      this.logger.error('An error occurred while getting min max price', {
        path: 'AuctionsService.getMinMaxPrice',
        exception: error,
      });
    }
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
      (!queryRequest.customFilters ||
        queryRequest.customFilters?.length === 0) &&
      this.isSortingByCreationDate(queryRequest)
    );
  }

  private isSortingByCreationDate(queryRequest: QueryRequest) {
    return (
      !queryRequest.sorting ||
      queryRequest.sorting?.length === 0 ||
      (queryRequest.sorting?.length === 1 &&
        queryRequest.sorting[0].field === 'creationDate')
    );
  }

  private async getMarketplaceAuctions(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    let [auctions, count, priceRange] = await this.getMarketplaceAuctionsMap();
    auctions = auctions.filter(
      (a) => a.endDate > DateUtils.getCurrentTimestamp(),
    );
    const tagsFilter = queryRequest.filters.filters.filter(
      (item) => item.field === 'tags',
    );
    if (tagsFilter && !tagsFilter[0]?.values?.every((v) => v === null)) {
      auctions = auctions.filter((a) =>
        tagsFilter[0].values.every((tag) => a.tags.includes(tag)),
      );
    }
    count = auctions.length;
    auctions = this.sortByCreationDate(queryRequest, auctions);
    auctions = auctions?.slice(
      queryRequest.offset,
      queryRequest.offset + queryRequest.limit,
    );
    return [
      auctions?.map((item) => Auction.fromEntity(item)),
      count,
      priceRange,
    ];
  }

  private sortByCreationDate(
    queryRequest: QueryRequest,
    auctions: AuctionWithStartBid[],
  ) {
    let sortedAuctions = [...auctions];
    if (
      queryRequest.sorting?.length === 1 &&
      queryRequest.sorting[0].direction === Sort.DESC
    ) {
      sortedAuctions = sortedAuctions?.sortedDescending((a) =>
        new Date(a.creationDate).getTime(),
      );
    } else if (
      queryRequest.sorting?.length === 1 &&
      queryRequest.sorting[0].direction === Sort.ASC
    ) {
      sortedAuctions = sortedAuctions?.sort(
        (a, b) =>
          new Date(a.creationDate).getTime() -
          new Date(b.creationDate).getTime(),
      );
    }
    return sortedAuctions;
  }

  private async getEndingAuctions(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    if (
      queryRequest.filters.filters.find(
        (f) =>
          f.field === 'endDate' &&
          f.values.length === 1 &&
          parseInt(f.values[0]) < DateUtils.getCurrentTimestampPlusMinute(10),
      )
    ) {
      let [auctions, count, priceRange] = await this.getAuctionsToday();
      auctions = auctions.filter(
        (a) => a.endDate > DateUtils.getCurrentTimestamp(),
      );
      count = auctions.length;
      auctions = auctions?.slice(
        queryRequest.offset,
        queryRequest.offset + queryRequest.limit,
      );

      return [
        auctions?.map((item) => Auction.fromEntity(item)),
        count,
        priceRange,
      ];
    }
    let [auctions, count, priceRange] = await this.getAuctionsEndingInAMonth();
    auctions = auctions.filter(
      (a) => a.endDate > DateUtils.getCurrentTimestamp(),
    );
    auctions = auctions?.slice(
      queryRequest.offset,
      queryRequest.offset + queryRequest.limit,
    );

    return [
      auctions?.map((item) => Auction.fromEntity(item)),
      count,
      priceRange,
    ];
  }

  private async getAuctionsToday(): Promise<
    [AuctionWithBidsCount[], number, PriceRange]
  > {
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
    [AuctionWithStartBid[], number, PriceRange]
  > {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.MarketplaceAuctions.key,
      () => this.getMarketplaceAuctionsQuery(DateUtils.getCurrentTimestamp()),
      5 * TimeConstants.oneMinute,
    );
  }

  private async getAuctionsEndingInAMonth(): Promise<
    [AuctionWithBidsCount[], number, PriceRange]
  > {
    return await this.auctionCachiungService.getAuctionsEndingInAMonth(() =>
      this.getRunningAuctionsEndingBefore(
        DateUtils.getCurrentTimestampPlusDays(30),
      ),
    );
  }

  private async getMappedClaimableAuctions(
    limit: number = 10,
    offset: number = 0,
    address: string,
    marketplaceKey: string,
  ) {
    let [auctions, count] = [[], 0];
    if (marketplaceKey) {
      [auctions, count] =
        await this.auctionServiceDb.getClaimableAuctionsForMarketplaceKey(
          limit,
          offset,
          address,
          marketplaceKey,
        );
    } else {
      [auctions, count] = await this.auctionServiceDb.getClaimableAuctions(
        limit,
        offset,
        address,
      );
    }
    return [auctions?.map((element) => Auction.fromEntity(element)), count];
  }

  private async getMappedAuctions(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    if (this.filtersByIdentifierWithoutId(queryRequest)) {
      return await this.getAuctionsForIdentifier(queryRequest);
    }
    if (queryRequest?.groupByOption?.groupBy === GroupBy.IDENTIFIER) {
      return await this.getAuctionsGroupByIdentifier(queryRequest);
    }

    const [auctions, count, priceRange] =
      await this.auctionServiceDb.getAuctions(queryRequest);

    return [
      auctions?.map((element) => Auction.fromEntity(element)),
      count,
      priceRange,
    ];
  }

  private filtersByIdentifierWithoutId(queryRequest: QueryRequest) {
    return (
      queryRequest?.filters?.filters?.some(
        (f) => f.field === 'identifier' && f.op === Operation.EQ,
      ) &&
      !queryRequest?.filters?.filters?.some(
        (f) => f.field === 'id' && f.op === Operation.EQ,
      )
    );
  }

  private async getAuctionsForIdentifier(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    const [auctions, count, priceRange] =
      await this.auctionServiceDb.getAuctionsForIdentifier(queryRequest);
    return [
      auctions?.map((element) => Auction.fromEntity(element)),
      count,
      priceRange,
    ];
  }

  async getAuctionsGroupByIdentifier(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    const collectionValues = queryRequest.filters.filters.find(x => x.field === 'collection')?.values;
    if (collectionValues && collectionValues.length > 0) {
      const collection = collectionValues[0];

      const offset = queryRequest.offset;
      const limit = queryRequest.limit;

      queryRequest.limit = 10000;

      const [allAuctions, _totalCount, priceRange] = await this.cacheService.getOrSetCache(
        this.redisClient,
        `collectionAuctions:${collection}`,
        async () => await this.getAuctionsGroupByIdentifierRaw(queryRequest),
        Constants.oneMinute() * 10,
        Constants.oneSecond() * 30,
      );

      const auctions = allAuctions.slice(offset, offset + limit);

      return [auctions, allAuctions.length, priceRange];
    }

    const [auctions, count, priceRange] =
      await this.auctionServiceDb.getAuctionsGroupBy(queryRequest);

    return [
      auctions?.map((element) => Auction.fromEntity(element)),
      count,
      priceRange,
    ];
  }

  async getAuctionsGroupByIdentifierRaw(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    const [auctions, count, priceRange] =
      await this.auctionServiceDb.getAuctionsGroupBy(queryRequest);

    return [
      auctions?.map((element) => Auction.fromEntity(element)),
      count,
      priceRange,
    ];
  }

  private async getMappedAuctionsOrderBids(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    let [auctions, count, priceRange] = [[], 0, undefined];
    if (queryRequest?.groupByOption?.groupBy === GroupBy.IDENTIFIER) {
      [auctions, count, priceRange] =
        await this.auctionServiceDb.getAuctionsOrderByOrdersCountGroupByIdentifier(
          queryRequest,
        );
    } else {
      [auctions, count, priceRange] =
        await this.auctionServiceDb.getAuctionsOrderByOrdersCount(queryRequest);
    }

    return [
      auctions?.map((element) => Auction.fromEntity(element)),
      count,
      priceRange,
    ];
  }
}
