import { Inject, Injectable } from '@nestjs/common';
import { Auction } from './models';
import '../../utils/extensions';
import { AuctionEntity } from 'src/db/auctions';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as Redis from 'ioredis';
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
import { Constants } from '@elrondnetwork/erdnest';
import { cacheConfig, elrondConfig } from 'src/config';
import { AuctionCustomEnum } from '../common/filters/AuctionCustomFilters';
import BigNumber from 'bignumber.js';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { Token } from 'src/common/services/elrond-communication/models/Token.model';
import { UsdPriceService } from '../usdPrice/usd-price.service';
import {
  auctionsByNoBidsRequest,
  buyNowAuctionRequest,
  getAuctionsForCollectionRequest,
  getAuctionsForPaymentTokenRequest,
  runningAuctionRequest,
} from './auctionsRequest';
import { CurrentPaymentTokensFilters } from './models/CurrentPaymentTokens.Filter';
import denominate from 'src/utils/formatters';

@Injectable()
export class AuctionsGetterService {
  private redisClient: Redis.Redis;
  private auctionsRedisClient: Redis.Redis;
  constructor(
    private persistenceService: PersistenceService,
    private auctionCachingService: AuctionsCachingService,
    private cacheService: CachingService,
    private readonly usdPriceService: UsdPriceService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
    this.auctionsRedisClient = this.cacheService.getClient(
      cacheConfig.auctionsRedisClientName,
    );
  }

  async getAuctions(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    try {
      return await this.auctionCachingService.getOrSetAuctions(
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

      const tags = queryRequest.getFilterName('tags');
      if (tags && tags.length > 0 && tags[0]) {
        return this.getMappedAuctionsOrderBids(queryRequest);
      }

      const [allAuctions, count, priceRange] =
        await this.cacheService.getOrSetCache(
          this.redisClient,
          CacheInfo.TopAuctionsOrderByNoBids.key,
          async () => this.getTopAuctionsOrderByNoBids(),
          CacheInfo.TopAuctionsOrderByNoBids.ttl,
        );

      const auctions = allAuctions.slice(
        queryRequest.offset,
        queryRequest.offset + queryRequest.limit,
      );

      return [auctions, count, priceRange];
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
      return await this.auctionCachingService.getClaimableAuctions(
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
      await this.persistenceService.getAuctionsEndingBefore(endDate);
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
      await this.persistenceService.getAuctionsForMarketplace(startDate);
    auctions = auctions?.map((item) => new AuctionWithStartBid(item));

    const group: { key: string; value: AuctionWithBidsCount[] } =
      auctions?.groupBy((a) => a.identifier, false);
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
    return await this.persistenceService.getAuctionsThatReachedDeadline();
  }

  async getAuctionById(id: number): Promise<AuctionEntity> {
    return await this.persistenceService.getAuction(id);
  }

  async getAuctionByIdAndMarketplace(
    id: number,
    marketplaceKey: string,
  ): Promise<AuctionEntity> {
    return await this.persistenceService.getAuctionByMarketplace(
      id,
      marketplaceKey,
    );
  }

  async getAvailableTokens(id: number): Promise<number> {
    return await this.persistenceService.getAvailableTokensByAuctionId(id);
  }

  async getMinMaxPrice(
    token: string,
  ): Promise<{ minBid: string; maxBid: string }> {
    try {
      return await this.auctionCachingService.getMinAndMax(token, () =>
        this.persistenceService.getMinMax(token),
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
    return await this.auctionCachingService.getAuctionsEndingInAMonth(() =>
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
        await this.persistenceService.getClaimableAuctionsForMarketplaceKey(
          limit,
          offset,
          address,
          marketplaceKey,
        );
    } else {
      [auctions, count] = await this.persistenceService.getClaimableAuctions(
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
      await this.persistenceService.getAuctions(queryRequest);

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
      await this.persistenceService.getAuctionsForIdentifier(queryRequest);
    return [
      auctions?.map((element) => Auction.fromEntity(element)),
      count,
      priceRange,
    ];
  }

  async getAuctionsGroupByIdentifier(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    const collectionFilter = queryRequest.getFilterName('collection');
    const paymentTokenFilter = queryRequest.getFilterName('paymentToken');
    const currentPriceFilter = queryRequest.getRange(
      AuctionCustomEnum.CURRENTPRICE,
    );
    const sort = queryRequest.getSort();
    const allFilters = queryRequest.getAllFilters();

    const hasCurrentPriceFilter =
      currentPriceFilter &&
      (currentPriceFilter.startPrice !== '0000000000000000000' ||
        currentPriceFilter.endPrice !== '0000000000000000000');

    if (collectionFilter && !hasCurrentPriceFilter) {
      return await this.retriveCollectionAuctions(
        collectionFilter,
        queryRequest,
        sort,
      );
    }

    if (paymentTokenFilter && !hasCurrentPriceFilter) {
      return await this.retriveTokensAuctions(
        paymentTokenFilter,
        queryRequest,
        sort,
      );
    }

    if (this.requestForRunningAuctions(allFilters, queryRequest)) {
      return await this.retrieveRunningAuctions(sort, queryRequest);
    }

    if (this.requestForBuyNowAuctions(allFilters, queryRequest)) {
      return await this.retrieveBuyNowAuctions(sort, queryRequest);
    }

    const [auctions, count, priceRange] =
      await this.persistenceService.getAuctionsGroupBy(queryRequest);

    return [
      auctions?.map((element) => Auction.fromEntity(element)),
      count,
      priceRange,
    ];
  }

  private async retriveCollectionAuctions(
    collectionFilter: string,
    queryRequest: QueryRequest,
    sort: { field: string; direction: Sort },
  ): Promise<[Auction[], number, PriceRange]> {
    let [allAuctions, _totalCount, priceRange] =
      await this.cacheService.getOrSetCache(
        this.auctionsRedisClient,
        `collectionAuctions:${collectionFilter}`,
        async () => await this.getAuctionsByCollection(collectionFilter),
        Constants.oneMinute() * 10,
        Constants.oneSecond() * 30,
      );

    const marketplaceFilter = queryRequest.getFilterName('marketplaceKey');
    const typeFilter = queryRequest.getFilter('type');
    if (typeFilter) {
      allAuctions = allAuctions.filter((x) =>
        typeFilter.values.includes(x.type),
      );
    }

    const paymentTokenFilter = queryRequest.getFilter('paymentToken');
    if (paymentTokenFilter) {
      allAuctions = allAuctions.filter((x) =>
        paymentTokenFilter.values.includes(x.minBid?.token),
      );
      priceRange = this.computePriceRange(
        allAuctions,
        paymentTokenFilter.values[0] ?? elrondConfig.egld,
      );
    }

    if (marketplaceFilter) {
      allAuctions = allAuctions.filter(
        (x) => x.marketplaceKey === marketplaceFilter,
      );

      priceRange = this.computePriceRange(allAuctions);
    }

    if (sort) {
      if (sort.direction === Sort.ASC) {
        allAuctions = allAuctions.sorted((x) => x[sort.field]);
      } else {
        allAuctions = allAuctions.sortedDescending((x) => x[sort.field]);
      }
    }

    const count = allAuctions.length;
    const auctions = allAuctions.slice(
      queryRequest.offset,
      queryRequest.offset + queryRequest.limit,
    );

    return [auctions, count, priceRange];
  }

  private async retriveTokensAuctions(
    paymentTokenFilter: string,
    queryRequest: QueryRequest,
    sort: { field: string; direction: Sort },
  ): Promise<[Auction[], number, PriceRange]> {
    let [allAuctions, _totalCount, priceRange] =
      await this.cacheService.getOrSetCache(
        this.auctionsRedisClient,
        `paymentTokenAuctions:${paymentTokenFilter}`,
        async () => await this.getAuctionsByPaymentToken(paymentTokenFilter),
        Constants.oneMinute() * 10,
        Constants.oneSecond() * 30,
      );

    const marketplaceFilter = queryRequest.getFilterName('marketplaceKey');
    const typeFilter = queryRequest.getFilter('type');
    if (typeFilter) {
      allAuctions = allAuctions.filter((x) =>
        typeFilter.values.includes(x.type),
      );
    }

    if (marketplaceFilter) {
      allAuctions = allAuctions.filter(
        (x) => x.marketplaceKey === marketplaceFilter,
      );

      priceRange = this.computePriceRange(allAuctions);
    }

    if (sort) {
      if (sort.direction === Sort.ASC) {
        allAuctions = allAuctions.sorted((x) => x[sort.field]);
      } else {
        allAuctions = allAuctions.sortedDescending((x) => x[sort.field]);
      }
    }

    const count = allAuctions.length;
    const auctions = allAuctions.slice(
      queryRequest.offset,
      queryRequest.offset + queryRequest.limit,
    );

    return [auctions, count, priceRange];
  }

  private async retrieveRunningAuctions(
    sort: { field: string; direction: Sort },
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    let [allAuctions, _totalCount, priceRange] =
      await this.cacheService.getOrSetCache(
        this.redisClient,
        CacheInfo.ActiveAuctions.key,
        async () => await this.getActiveAuctions(),
        CacheInfo.ActiveAuctions.ttl,
        Constants.oneSecond() * 30,
      );

    if (sort) {
      if (sort.direction === Sort.ASC) {
        allAuctions = allAuctions.sorted((x) => x[sort.field]);
      } else {
        allAuctions = allAuctions.sortedDescending((x) => x[sort.field]);
      }
    }

    const count = allAuctions.length;
    const auctions = allAuctions.slice(
      queryRequest.offset,
      queryRequest.offset + queryRequest.limit,
    );

    return [auctions, count, priceRange];
  }

  private async retrieveBuyNowAuctions(
    sort: { field: string; direction: Sort },
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    let [allAuctions, _totalCount, priceRange] =
      await this.cacheService.getOrSetCache(
        this.redisClient,
        CacheInfo.ActiveAuctions.key,
        async () => await this.getBuyNowAuctions(),
        CacheInfo.ActiveAuctions.ttl,
        Constants.oneSecond() * 30,
      );

    if (sort) {
      if (sort.direction === Sort.ASC) {
        allAuctions = allAuctions.sorted((x) => x[sort.field]);
      } else {
        allAuctions = allAuctions.sortedDescending((x) => x[sort.field]);
      }
    }

    const count = allAuctions.length;
    const auctions = allAuctions.slice(
      queryRequest.offset,
      queryRequest.offset + queryRequest.limit,
    );

    return [auctions, count, priceRange];
  }

  private requestForRunningAuctions(
    allFilters: Record<string, string>,
    queryRequest: QueryRequest,
  ) {
    const statusFilter = queryRequest.getFilterName('status');
    const startDateFilter = queryRequest.getFilterName('startDate');
    return (
      Object.keys(allFilters).length === 2 && statusFilter && startDateFilter
    );
  }

  private requestForBuyNowAuctions(
    allFilters: Record<string, string>,
    queryRequest: QueryRequest,
  ) {
    const statusFilter = queryRequest.getFilterName('status');
    const startDateFilter = queryRequest.getFilterName('startDate');
    const buyNowFilter = queryRequest.getFilter('maxBid');
    return (
      Object.keys(allFilters).length === 3 &&
      statusFilter &&
      startDateFilter &&
      buyNowFilter &&
      buyNowFilter.op === Operation.GE
    );
  }

  private computePriceRange(
    auctions: Auction[],
    paymentToken: string = elrondConfig.egld,
  ): PriceRange {
    const minBids = auctions
      .filter((x) => x.minBid.token === paymentToken)
      .map((x) =>
        parseFloat(
          denominate({
            input: x.maxBid.amount,
            denomination: 18,
            decimals: 2,
            showLastNonZeroDecimal: true,
          }).replace(',', ''),
        ),
      );
    let minBid = 1000000000000000;
    for (const amount of minBids) {
      if (amount < minBid) {
        minBid = amount;
      }
    }

    const maxBids = auctions
      .filter((x) => x.maxBid.token === paymentToken)
      .map((x) =>
        parseFloat(
          denominate({
            input: x.maxBid.amount,
            denomination: 18,
            decimals: 2,
            showLastNonZeroDecimal: true,
          }).replace(',', ''),
        ),
      );
    let maxBid = minBid;
    for (const amount of maxBids) {
      if (amount > maxBid) {
        maxBid = amount;
      }
    }

    return {
      minBid: minBid ? minBid.toString() : '0',
      maxBid: maxBid ? maxBid.toString() : '0',
      paymentToken,
    };
  }

  // TODO: use db access directly without intermediate caching layers once we optimize the model
  async getTopAuctionsOrderByNoBids(): Promise<
    [Auction[], number, PriceRange]
  > {
    return this.getMappedAuctionsOrderBids(auctionsByNoBidsRequest);
  }

  // TODO: use db access directly without intermediate caching layers once we optimize the model
  async getBuyNowAuctions(): Promise<[Auction[], number, PriceRange]> {
    return await this.getAuctionsGroupByIdentifierRaw(buyNowAuctionRequest);
  }

  // TODO: use db access directly without intermediate caching layers once we optimize the model
  async getActiveAuctions(): Promise<[Auction[], number, PriceRange]> {
    return await this.getAuctionsGroupByIdentifierRaw(runningAuctionRequest);
  }

  // TODO: use db access directly without intermediate caching layers once we optimize the model
  async getAuctionsByCollection(
    collection: string,
  ): Promise<[Auction[], number, PriceRange]> {
    const queryRequest = getAuctionsForCollectionRequest(collection);

    return await this.getAuctionsGroupByIdentifierRaw(queryRequest);
  }

  // TODO: use db access directly without intermediate caching layers once we optimize the model
  async getAuctionsByPaymentToken(
    paymentToken: string,
  ): Promise<[Auction[], number, PriceRange]> {
    const queryRequest = getAuctionsForPaymentTokenRequest(paymentToken);

    return await this.getAuctionsGroupByIdentifierRaw(queryRequest);
  }

  async getAuctionsGroupByIdentifierRaw(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number, PriceRange]> {
    const [auctions, count, priceRange] =
      await this.persistenceService.getAuctionsGroupBy(queryRequest);

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
        await this.persistenceService.getAuctionsOrderByOrdersCountGroupByIdentifier(
          queryRequest,
        );
    } else {
      [auctions, count, priceRange] =
        await this.persistenceService.getAuctionsOrderByOrdersCount(
          queryRequest,
        );
    }

    return [
      auctions?.map((element) => Auction.fromEntity(element)),
      count,
      priceRange,
    ];
  }

  async getCurrentPaymentTokens(
    filters?: CurrentPaymentTokensFilters,
  ): Promise<Token[]> {
    try {
      return await this.auctionCachingService.getCurrentPaymentTokens(
        () =>
          this.getMappedCurrentPaymentTokens(
            filters?.marketplaceKey,
            filters?.collectionIdentifier,
          ),
        filters?.marketplaceKey,
        filters?.collectionIdentifier,
      );
    } catch (error) {
      this.logger.error('An error occurred while get auctions', {
        path: 'AuctionsService.getCurrentPaymentTokens',
        marketplaceKey: filters?.marketplaceKey,
        collectionIdentifier: filters?.collectionIdentifier,
        exception: error,
      });
    }
  }

  private async getMappedCurrentPaymentTokens(
    marketplaceKey?: string,
    collectionIdentifier?: string,
  ): Promise<Token[]> {
    const [currentPaymentTokenIds, allMexTokens, egldToken, lkmexToken] =
      await Promise.all([
        this.persistenceService.getCurrentPaymentTokenIdsWithCounts(
          marketplaceKey,
          collectionIdentifier,
        ),
        this.usdPriceService.getCachedMexTokensWithDecimals(),
        this.usdPriceService.getToken(elrondConfig.egld),
        this.usdPriceService.getToken(elrondConfig.lkmex),
      ]);

    const allTokens: Token[] = allMexTokens
      .concat(egldToken)
      .concat(lkmexToken);
    let mappedTokens = [];
    for (const payment of currentPaymentTokenIds) {
      const token = allTokens.find(
        (x) => x.identifier === payment.paymentToken,
      );
      if (token) {
        mappedTokens.push({ ...token, activeAuctions: payment.activeAuctions });
      }
    }

    return mappedTokens;
  }
}
