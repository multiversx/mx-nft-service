import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetAuctionsCountProvider } from 'src/modules/assets/asset-auctions-count.loader';
import { AuctionsForAssetProvider } from 'src/modules/auctions/asset-auctions.loader';
import { AuctionStatusEnum } from 'src/modules/auctions/models/AuctionStatus.enum';
import FilterQueryBuilder from 'src/modules/FilterQueryBuilder';
import { Sort, Sorting } from 'src/modules/filtersTypes';
import { DateUtils } from 'src/utils/date-utils';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QueryRequest, TrendingQueryRequest } from '../../modules/QueryRequest';
import { OrdersServiceDb } from '../orders';
import { AuctionEntity } from './auction.entity';

@Injectable()
export class AuctionsServiceDb {
  constructor(
    private auctionsLoader: AuctionsForAssetProvider,
    private assetsAuctionsCountLoader: AssetAuctionsCountProvider,
    private ordersService: OrdersServiceDb,
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
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    this.addOrderBy(queryRequest.sorting, queryBuilder);

    return await queryBuilder.getManyAndCount();
  }

  async getAuctionsGroupBy(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    queryBuilder.andWhere(`id IN(SELECT FIRST_VALUE(a.id) OVER (PARTITION BY identifier ORDER BY if(o.priceAmountDenominated, o.priceAmountDenominated, a.minBidDenominated) ASC) AS min_bid
      from auctions a 
      Left join orders o on a.id = o.auctionId 
      WHERE a.status in ('Running')
      order by if(o.priceAmountDenominated, o.priceAmountDenominated, a.minBidDenominated) ASC )`);
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    this.addOrderBy(queryRequest.sorting, queryBuilder);
    return await queryBuilder.getManyAndCount();
  }

  async getAuctionsForIdentifier(
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
      .orderBy(
        'if(o.priceAmountDenominated, o.priceAmountDenominated, a.minBidDenominated)',
      );
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    this.addOrderBy(queryRequest.sorting, queryBuilder, 'a');
    return await queryBuilder.getManyAndCount();
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
        `a.status = 'Running' AND a.type <> 'SftOnePerPayment' AND 
        ((a.endDate <= ${DateUtils.getCurrentTimestamp()} AND o.ownerAddress = '${address}' AND o.status='active')
        OR (o.ownerAddress = '${address}' AND o.status='active' AND a.maxBidDenominated=o.priceAmountDenominated))`,
      )
      .groupBy('a.id')
      .orderBy('a.Id', 'DESC')
      .offset(offset)
      .limit(limit)
      .getManyAndCount();
  }

  async getAuctionsOrderByOrdersCount(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
      'auctions',
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    queryBuilder
      .leftJoin('orders', 'o', 'o.auctionId=auctions.id')
      .groupBy('auctions.id')
      .orderBy('COUNT(auctions.Id)', 'DESC')
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

  async insertAuction(auction: AuctionEntity): Promise<AuctionEntity> {
    await this.invalidateCache(auction.identifier);
    return await this.auctionsRepository.save(auction);
  }

  async deleteAuctionAndOrdersByHash(blockHash: string): Promise<any> {
    const auctions = await this.getAuctionsForHash(blockHash);
    if (!auctions || auctions.length === 0) {
      return true;
    }
    await this.rollbackWithdrawAndEndAuction(auctions);
    await this.rollbackCreateAuction(auctions);
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

    await this.invalidateCache(auction.identifier);
    if (auction) {
      auction.status = status;
      auction.blockHash = hash;
      return await this.auctionsRepository.save(auction);
    }
    return null;
  }

  async updateAuctions(auctions: AuctionEntity[]): Promise<any> {
    for (let auction of auctions) {
      await this.invalidateCache(auction.identifier);
    }
    return await this.auctionsRepository.save(auctions);
  }

  private async invalidateCache(identifier: string) {
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
