import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuctionStatusEnum } from 'src/modules/auctions/models/AuctionStatus.enum';
import {
  AuctionCustomEnum,
  AuctionCustomSort,
} from 'src/modules/common/filters/AuctionCustomFilters';
import FilterQueryBuilder from 'src/modules/common/filters/FilterQueryBuilder';
import {
  Sorting,
  Sort,
  Operation,
  Operator,
} from 'src/modules/common/filters/filtersTypes';
import { QueryRequest } from 'src/modules/common/filters/QueryRequest';
import { CacheEventsPublisherService } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from 'src/modules/rabbitmq/cache-invalidation/events/owner-changed.event';
import { nominateAmount } from 'src/utils';
import { DateUtils } from 'src/utils/date-utils';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OrdersServiceDb } from '../orders';
import { AuctionEntity } from './auction.entity';
import { PriceRange } from './price-range';
import {
  getAuctionsForIdentifierSortByPrice,
  getAuctionsForIdentifierSortByPriceCount,
  getAuctionsOrderByNoBidsQuery,
  getAvailableTokensbyAuctionId,
  getAvailableTokensbyAuctionIdForMarketplace,
  getDefaultAuctionsForIdentifierQuery,
  getDefaultAuctionsForIdentifierQueryCount,
  getDefaultAuctionsQuery,
} from './sql.queries';

@Injectable()
export class AuctionsServiceDb {
  constructor(
    private ordersService: OrdersServiceDb,
    private readonly cacheEventsPublisherService: CacheEventsPublisherService,
    @InjectRepository(AuctionEntity)
    private auctionsRepository: Repository<AuctionEntity>,
  ) {}

  async getAuctions(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
      'a',
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    const currentPriceSort = this.handleCurrentPriceFilter(
      queryRequest,
      queryBuilder,
    );
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    if (currentPriceSort) {
      this.addCurrentPriceOrderBy(currentPriceSort, queryBuilder, 'a');
    } else {
      this.addOrderBy(queryRequest.sorting, queryBuilder, 'a');
    }
    const [response, priceRange] = await Promise.all([
      queryBuilder.getManyAndCount(),
      this.getMinMaxForQuery(queryRequest),
    ]);
    return [...response, priceRange];
  }

  async getAuctionsGroupBy(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
      'a',
    );
    const endDate = DateUtils.getCurrentTimestampPlus(12);
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();

    const currentPriceSort = this.handleCurrentPriceFilter(
      queryRequest,
      queryBuilder,
    );
    queryBuilder
      .innerJoin(
        `(SELECT FIRST_VALUE(id) OVER (PARTITION BY identifier ORDER BY eD, IF(price, price, minBidDenominated) ASC) AS id
    FROM (${getDefaultAuctionsQuery(endDate)})`,
        't',
        'a.id = t.id',
      )
      .groupBy('a.id');
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    if (currentPriceSort) {
      this.addCurrentPriceOrderBy(currentPriceSort, queryBuilder, 'a');
    } else {
      this.addOrderBy(queryRequest.sorting, queryBuilder, 'a');
    }
    const [auctions, priceRange] = await Promise.all([
      queryBuilder.getManyAndCount(),
      this.getMinMaxForQuery(queryRequest),
    ]);
    return [...auctions, priceRange];
  }

  private handleCurrentPriceFilter(
    queryRequest: QueryRequest,
    queryBuilder: SelectQueryBuilder<AuctionEntity>,
  ) {
    const maxBidValue = '1000000000';
    const currentPrice = queryRequest.customFilters?.find(
      (f) => f.field === AuctionCustomEnum.CURRENTPRICE,
    );
    const currentPriceSort = currentPrice?.sort;
    if (currentPrice || currentPriceSort) {
      queryBuilder.leftJoin(
        'orders',
        'o',
        'o.auctionId=a.id AND o.id =(SELECT MAX(id) FROM orders o2 WHERE o2.auctionId = a.id)',
      );
    }
    if (currentPrice) {
      const minBid =
        currentPrice.values?.length >= 1 && currentPrice.values[0]
          ? currentPrice.values[0]
          : 0;
      const maxBid =
        currentPrice.values?.length >= 2 && currentPrice.values[1]
          ? currentPrice.values[1]
          : nominateAmount(maxBidValue);
      queryBuilder.andWhere(
        `(if(o.priceAmount, o.priceAmount BETWEEN ${minBid} AND ${maxBid}, a.minBid BETWEEN ${minBid} AND ${maxBid})) `,
      );
    }
    return currentPriceSort;
  }

  async getAuctionsForIdentifier(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    const identifier = queryRequest.filters.filters.find(
      (x) => x.field === 'identifier',
    ).values[0];
    if (
      queryRequest?.sorting &&
      queryRequest?.sorting.some((f) => f.field === 'topBidPrice')
    ) {
      return await this.getAuctionsForIdentifierSortByPrice(
        queryRequest,
        identifier,
      );
    } else if (queryRequest.sorting) {
      return this.getAuctions(queryRequest);
    }
    const endDate = DateUtils.getCurrentTimestampPlus(12);
    const defaultAuctionsQuery = getDefaultAuctionsForIdentifierQuery(
      identifier,
      endDate,
      queryRequest.limit,
      queryRequest.offset,
      queryRequest.filters?.filters?.find((x) => x.field === 'status')?.values,
    );
    const sqlAuctionsCount = getDefaultAuctionsForIdentifierQueryCount(
      identifier,
      endDate,
      queryRequest.filters?.filters?.find((x) => x.field === 'status')?.values,
    );
    const [auctions, count, priceRange] = await Promise.all([
      this.auctionsRepository.query(defaultAuctionsQuery),
      this.auctionsRepository.query(sqlAuctionsCount),
      this.getMinMaxForQuery(queryRequest),
    ]);

    return [auctions, count[0]?.Count, priceRange];
  }

  async getAuctionsForHash(blockHash: string): Promise<AuctionEntity[]> {
    return this.auctionsRepository
      .createQueryBuilder()
      .where({ blockHash: blockHash })
      .getMany();
  }

  async getClaimableAuctions(
    limit: number = 10,
    offset: number = 0,
    address: string,
  ): Promise<[AuctionEntity[], number]> {
    return await this.auctionsRepository
      .createQueryBuilder('a')
      .innerJoin('orders', 'o', 'o.auctionId=a.id')
      .where(
        `a.status = '${AuctionStatusEnum.Claimable}' AND a.type <> 'SftOnePerPayment' AND 
        ((o.ownerAddress = '${address}' AND o.status='active'))`,
      )
      .groupBy('a.id')
      .orderBy('a.Id', 'DESC')
      .offset(offset)
      .limit(limit)
      .getManyAndCount();
  }

  async getClaimableAuctionsForMarketplaceKey(
    limit: number = 10,
    offset: number = 0,
    address: string,
    marketplaceKey: string,
  ): Promise<[AuctionEntity[], number]> {
    return await this.auctionsRepository
      .createQueryBuilder('a')
      .innerJoin('orders', 'o', 'o.auctionId=a.id')
      .where(
        `a.status = '${AuctionStatusEnum.Claimable}' AND a.type <> 'SftOnePerPayment' AND a.marketplaceKey = :marketplaceKey
        ((o.ownerAddress = :address AND o.status='active'))`,
        {
          address: address,
          marketplaceKey: marketplaceKey,
        },
      )
      .groupBy('a.id')
      .orderBy('a.Id', 'DESC')
      .offset(offset)
      .limit(limit)
      .getManyAndCount();
  }

  async getAuctionsOrderByOrdersCountGroupByIdentifier(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
      'a',
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();

    queryBuilder
      .leftJoin('orders', 'o', 'o.auctionId=a.id')
      .innerJoin(
        `(SELECT FIRST_VALUE(id) over ( PARTITION by identifier ORDER BY COUNT(id) DESC) AS id
      FROM (${getAuctionsOrderByNoBidsQuery()})`,
        't',
        'a.id = t.id',
      )
      .groupBy('a.id')
      .orderBy('COUNT(a.Id)', 'DESC')
      .offset(queryRequest.offset)
      .limit(queryRequest.limit);
    const [auctions, priceRange] = await Promise.all([
      queryBuilder.getManyAndCount(),
      this.getMinMaxForQuery(queryRequest),
    ]);
    return [...auctions, priceRange];
  }

  async getAuctionsOrderByOrdersCount(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
      'a',
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    queryBuilder
      .leftJoin('orders', 'o', 'o.auctionId=a.id')
      .groupBy('a.id')
      .orderBy('COUNT(a.Id)', 'DESC')
      .offset(queryRequest.offset)
      .limit(queryRequest.limit);

    const [auctions, priceRange] = await Promise.all([
      queryBuilder.getManyAndCount(),
      this.getMinMaxForQuery(queryRequest),
    ]);
    return [...auctions, priceRange];
  }

  async getAuctionsEndingBefore(endDate: number): Promise<any[]> {
    const getAuctions = this.auctionsRepository
      .createQueryBuilder('a')
      .select('a.*')
      .addSelect('COUNT(`o`.`auctionId`) as ordersCount')
      .leftJoin('orders', 'o', 'o.auctionId=a.id')
      .groupBy('a.id')
      .where({ status: AuctionStatusEnum.Running })
      .andWhere(`a.endDate <= ${endDate}`)
      .execute();
    const getPriceRange = this.getMinMaxForQuery(
      this.getDefaultQueryRequest(DateUtils.getCurrentTimestamp(), endDate),
    );

    return await Promise.all([getAuctions, getPriceRange]);
  }

  async getAuctionsForMarketplace(
    startDate: number,
  ): Promise<[any[], PriceRange]> {
    const getAuctions = await this.auctionsRepository
      .createQueryBuilder('a')
      .select('a.*')
      .addSelect(
        'if(COUNT(`o`.`auctionId`)>0,MAX(o.priceAmountDenominated),a.minBidDenominated) as startBid',
      )
      .leftJoin('orders', 'o', 'o.auctionId=a.id')
      .groupBy('a.id')
      .where({ status: AuctionStatusEnum.Running })
      .andWhere(`a.startDate <= ${startDate}`)
      .execute();
    const getPriceRange = await this.getMinMaxForQuery(
      this.getDefaultQueryRequest(startDate),
    );
    return await Promise.all([getAuctions, getPriceRange]);
  }

  async getMinMax(): Promise<PriceRange> {
    const response = await this.auctionsRepository
      .createQueryBuilder('a')
      .select(
        'if(MAX(a.maxBidDenominated)>MAX(o.priceAmountDenominated), MAX(a.maxBidDenominated),MAX(o.priceAmountDenominated)) as maxBid, MIN(a.minBidDenominated) as minBid',
      )
      .leftJoin(
        'orders',
        'o',
        'o.auctionId=a.id AND o.id =(SELECT MAX(id) FROM orders o2 WHERE o2.auctionId = a.id)',
      )
      .where({ status: AuctionStatusEnum.Running })
      .execute();
    return response[0];
  }

  private async getMinMaxForQuery(
    queryRequest: QueryRequest,
  ): Promise<PriceRange> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
      'a',
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    const response = await queryBuilder
      .select(
        'if(MAX(a.maxBidDenominated)>MAX(o.priceAmountDenominated), MAX(a.maxBidDenominated),MAX(o.priceAmountDenominated)) as maxBid, MIN(a.minBidDenominated) as minBid',
      )
      .leftJoin(
        'orders',
        'o',
        'o.auctionId=a.id AND o.id =(SELECT MAX(id) FROM orders o2 WHERE o2.auctionId = a.id)',
      )
      .execute();
    return response[0];
  }

  async getAuction(id: number): Promise<AuctionEntity> {
    if (id !== undefined) {
      return await this.auctionsRepository.findOne({
        where: [{ id: id }],
      });
    }
    return null;
  }

  async getAuctionByMarketplace(
    id: number,
    marketplaceKey: string,
  ): Promise<AuctionEntity> {
    if (id !== undefined) {
      return await this.auctionsRepository.findOne({
        where: [{ marketplaceAuctionId: id, marketplaceKey: marketplaceKey }],
      });
    }
    return null;
  }

  async getAvailableTokens(id: number): Promise<any> {
    return await this.auctionsRepository.query(
      getAvailableTokensbyAuctionId(id),
    );
  }

  async getAvailableTokensForSpecificMarketplace(
    id: number,
    marketplaceKey: string,
  ): Promise<any> {
    return await this.auctionsRepository.query(
      getAvailableTokensbyAuctionIdForMarketplace(id, marketplaceKey),
    );
  }

  async getAuctionsThatReachedDeadline(): Promise<AuctionEntity[]> {
    return await this.auctionsRepository
      .createQueryBuilder('a')
      .where({ status: AuctionStatusEnum.Running })
      .andWhere(`a.endDate <= ${DateUtils.getCurrentTimestamp()}`)
      .getMany();
  }

  async insertAuction(auction: AuctionEntity): Promise<AuctionEntity> {
    await this.triggerCacheInvalidation(
      auction.identifier,
      auction.ownerAddress,
    );
    console.log({ auction });
    return await this.auctionsRepository.save(auction);
  }

  async rollbackAuctionAndOrdersByHash(blockHash: string): Promise<any> {
    const auctions = await this.getAuctionsForHash(blockHash);
    if (!auctions || auctions.length === 0) {
      return true;
    }
    await this.rollbackWithdrawAndEndAuction(auctions);
    await this.rollbackCreateAuction(auctions);
  }

  private getDefaultQueryRequest(
    startDate: number,
    endDate: number = null,
  ): QueryRequest {
    if (endDate) {
      return new QueryRequest({
        filters: {
          childExpressions: undefined,
          filters: [
            { field: 'status', values: ['Running'], op: Operation.EQ },
            { field: 'startDate', values: [`${startDate}`], op: Operation.LE },
            { field: 'endDate', values: [`${startDate}`], op: Operation.LE },
          ],
          operator: Operator.AND,
        },
      });
    }
    return new QueryRequest({
      filters: {
        childExpressions: undefined,
        filters: [
          { field: 'status', values: ['Running'], op: Operation.EQ },
          { field: 'startDate', values: [`${startDate}`], op: Operation.LE },
        ],
        operator: Operator.AND,
      },
    });
  }

  private async getAuctionsForIdentifierSortByPrice(
    queryRequest: QueryRequest,
    identifier: string,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    const [auctions, count, priceRange] = await Promise.all([
      this.auctionsRepository.query(
        getAuctionsForIdentifierSortByPrice(
          identifier,
          queryRequest.limit,
          queryRequest.offset,
        ),
      ),
      this.auctionsRepository.query(
        getAuctionsForIdentifierSortByPriceCount(identifier),
      ),
      this.getMinMaxForQuery(queryRequest),
    ]);
    return [auctions, count[0]?.Count, priceRange];
  }

  private async rollbackCreateAuction(auctions: AuctionEntity[]) {
    const runningAuction = auctions.filter((a) => a.status === 'Running');

    if (runningAuction.length > 0) {
      const deleteAuction = await this.auctionsRepository.delete(
        runningAuction.map((a) => a.id),
      );
      if (deleteAuction) {
        await this.ordersService.deleteOrdersByAuctionId(
          runningAuction.map((a) => a.id),
        );
      }
    }
  }

  private async rollbackWithdrawAndEndAuction(auctions: AuctionEntity[]) {
    const closedAuctins = auctions?.filter((a) => a.status !== 'Running');
    await this.updateAuctions(
      closedAuctins?.map((a) => {
        return {
          ...a,
          status: AuctionStatusEnum.Running,
          modifiedDate: new Date(new Date().toUTCString()),
        };
      }),
    );
  }

  async updateAuction(
    auctionId: number,
    status: AuctionStatusEnum,
    hash: string,
  ): Promise<AuctionEntity> {
    let auction = await this.getAuction(auctionId);

    await this.triggerCacheInvalidation(
      auction.identifier,
      auction.ownerAddress,
    );
    if (auction) {
      auction.status = status;
      auction.blockHash = hash;
      return await this.auctionsRepository.save(auction);
    }
    return null;
  }

  async updateAuctionByMarketplace(
    auctionId: number,
    marketplaceKey: string,
    status: AuctionStatusEnum,
    hash: string,
  ): Promise<AuctionEntity> {
    let auction = await this.getAuctionByMarketplace(auctionId, marketplaceKey);

    await this.triggerCacheInvalidation(
      auction.identifier,
      auction.ownerAddress,
    );
    if (auction) {
      auction.status = status;
      auction.blockHash = hash;
      return await this.auctionsRepository.save(auction);
    }
    return null;
  }

  async updateAuctions(auctions: AuctionEntity[]): Promise<any> {
    for (let auction of auctions) {
      await this.triggerCacheInvalidation(
        auction.identifier,
        auction.ownerAddress,
      );
    }
    return await this.auctionsRepository.save(auctions);
  }

  private async triggerCacheInvalidation(
    identifier: string,
    ownerAddress: string,
  ) {
    await this.cacheEventsPublisherService.publish(
      new ChangedEvent({
        id: identifier,
        type: CacheEventTypeEnum.UpdateAuction,
        ownerAddress: ownerAddress,
      }),
    );
  }

  private addOrderBy(
    sorting: Sorting[],
    queryBuilder: SelectQueryBuilder<AuctionEntity>,
    alias: string = null,
  ) {
    if (sorting) {
      sorting?.forEach((sort) =>
        queryBuilder.addOrderBy(
          alias ? `${alias}.${sort.field}` : sort.field,
          Sort[sort.direction] === 'ASC' ? 'ASC' : 'DESC',
        ),
      );
      if (!sorting.find((sort) => sort.field === 'id')) {
        queryBuilder.addOrderBy(alias ? `${alias}.id` : 'id', 'ASC');
      }
    }
  }

  private addCurrentPriceOrderBy(
    sort: AuctionCustomSort,
    queryBuilder: SelectQueryBuilder<AuctionEntity>,
    alias: string = null,
  ) {
    queryBuilder.addGroupBy('o.priceAmountDenominated');
    queryBuilder.addOrderBy(
      'if(o.priceAmountDenominated, o.priceAmountDenominated, a.minBidDenominated)',

      Sort[sort.direction] === 'ASC' ? 'ASC' : 'DESC',
    ),
      queryBuilder.addOrderBy(alias ? `${alias}.id` : 'id', 'ASC');
  }
}
