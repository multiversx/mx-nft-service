import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountsStatsService } from 'src/modules/account-stats/accounts-stats.service';
import { AssetAuctionsCountRedisHandler } from 'src/modules/assets/loaders/asset-auctions-count.redis-handler';
import { AuctionsForAssetRedisHandler } from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models/AuctionStatus.enum';
import FilterQueryBuilder from 'src/modules/common/filters/FilterQueryBuilder';
import { Sorting, Sort } from 'src/modules/common/filters/filtersTypes';
import {
  QueryRequest,
  TrendingQueryRequest,
} from 'src/modules/common/filters/QueryRequest';
import { DateUtils } from 'src/utils/date-utils';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OrdersServiceDb } from '../orders';
import { AuctionEntity } from './auction.entity';
import {
  getAuctionsForIdentifierSortByPrice,
  getAuctionsForIdentifierSortByPriceCount,
  getAuctionsOrderByNoBidsQuery,
  getAvailableTokensbyAuctionId,
  getDefaultAuctionsForIdentifierQuery,
  getDefaultAuctionsForIdentifierQueryCount,
  getDefaultAuctionsQuery,
} from './sql.queries';

@Injectable()
export class AuctionsServiceDb {
  constructor(
    private auctionsLoader: AuctionsForAssetRedisHandler,
    private assetsAuctionsCountLoader: AssetAuctionsCountRedisHandler,
    private ordersService: OrdersServiceDb,
    private accountStats: AccountsStatsService,
    @InjectRepository(AuctionEntity)
    private auctionsRepository: Repository<AuctionEntity>,
  ) {}

  async getAuctionsForOwner(ownerAddress: string): Promise<AuctionEntity[]> {
    return await this.auctionsRepository.find({
      where: [{ ownerAddress: ownerAddress }],
    });
  }
  async getAuctions(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
      'a',
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    this.addOrderBy(queryRequest.sorting, queryBuilder, 'a');

    return await queryBuilder.getManyAndCount();
  }

  async getAuctionsGroupBy(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
      'a',
    );
    const endDate = DateUtils.getCurrentTimestampPlus(12);
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    queryBuilder.andWhere(`id IN(SELECT FIRST_VALUE(id) over ( PARTITION by identifier  order by eD, if(price, price, minBidDenominated) ASC )
    from (${getDefaultAuctionsQuery(endDate)})`);
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    this.addOrderBy(queryRequest.sorting, queryBuilder);
    return await queryBuilder.getManyAndCount();
  }

  async getAuctionsForIdentifier(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number]> {
    try {
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
        queryRequest.filters?.filters?.find((x) => x.field === 'status')
          ?.values,
      );
      const sqlAuctionsCount = getDefaultAuctionsForIdentifierQueryCount(
        identifier,
        endDate,
        queryRequest.filters?.filters?.find((x) => x.field === 'status')
          ?.values,
      );
      const [auctions, count] = await Promise.all([
        this.auctionsRepository.query(defaultAuctionsQuery),
        this.auctionsRepository.query(sqlAuctionsCount),
      ]);
      return [auctions, count[0]?.Count];
    } catch (error) {
      console.log(error);
    }
  }

  async getAuctionsForHash(blockHash: string): Promise<AuctionEntity[]> {
    return this.auctionsRepository
      .createQueryBuilder()
      .where({ blockHash: blockHash })
      .getMany();
  }

  async getTrendingAuctions(
    queryRequest: TrendingQueryRequest,
  ): Promise<[AuctionEntity[], number]> {
    return await this.auctionsRepository
      .createQueryBuilder('a')
      .innerJoin('orders', 'o', 'o.auctionId=a.id')
      .where(
        `a.status = 'Running' AND o.creationDate  
        BETWEEN '${this.getSqlDate(queryRequest.startDate)}' 
        AND '${this.getSqlDate(queryRequest.endDate)}'`,
      )
      .groupBy('a.id')
      .orderBy('COUNT(a.Id)', 'DESC')
      .offset(queryRequest.offset)
      .limit(queryRequest.limit)
      .getManyAndCount();
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

  async getAuctionsOrderByOrdersCountGroupByIdentifier(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
      'a',
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    queryBuilder
      .leftJoin('orders', 'o', 'o.auctionId=a.id')
      .andWhere(
        `a.id IN(SELECT FIRST_VALUE(id) over ( PARTITION by identifier ORDER BY COUNT(id) DESC) 
    from (${getAuctionsOrderByNoBidsQuery()})`,
      )
      .groupBy('a.id')
      .orderBy('COUNT(a.Id)', 'DESC')
      .offset(queryRequest.offset)
      .limit(queryRequest.limit);

    return await queryBuilder.getManyAndCount();
  }

  async getAuctionsOrderByOrdersCount(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number]> {
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

    return await queryBuilder.getManyAndCount();
  }

  async getAuction(id: number): Promise<AuctionEntity> {
    if (id || id === 0) {
      return await this.auctionsRepository.findOne({
        where: [{ id: id }],
      });
    }
    return null;
  }

  async getAvailableTokens(id: number): Promise<any> {
    return await this.auctionsRepository.query(
      getAvailableTokensbyAuctionId(id),
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
    await this.invalidateCache(auction.identifier, auction.ownerAddress);
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

  private async getAuctionsForIdentifierSortByPrice(
    queryRequest: QueryRequest,
    identifier: string,
  ): Promise<[AuctionEntity[], number]> {
    const [auctions, count] = await Promise.all([
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
    ]);

    return [auctions, count[0]?.Count];
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

    await this.invalidateCache(auction.identifier, auction.ownerAddress);
    if (auction) {
      auction.status = status;
      auction.blockHash = hash;
      return await this.auctionsRepository.save(auction);
    }
    return null;
  }

  async updateAuctions(auctions: AuctionEntity[]): Promise<any> {
    for (let auction of auctions) {
      await this.invalidateCache(auction.identifier, auction.ownerAddress);
    }
    return await this.auctionsRepository.save(auctions);
  }

  private async invalidateCache(identifier: string, address: string) {
    await this.accountStats.invalidateStats(address);
    await this.auctionsLoader.clearKey(identifier);
    await this.assetsAuctionsCountLoader.clearKey(identifier);
  }

  private getSqlDate(timestamp: number) {
    return new Date(timestamp * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
  }

  private addOrderBy(
    sorting: Sorting[],
    queryBuilder: SelectQueryBuilder<AuctionEntity>,
    alias: string = null,
  ) {
    sorting?.forEach((sort) =>
      queryBuilder.addOrderBy(
        alias ? `${alias}.${sort.field}` : sort.field,
        Sort[sort.direction] === 'ASC' ? 'ASC' : 'DESC',
      ),
    );
  }
}
