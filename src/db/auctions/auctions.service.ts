import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuctionStatusEnum } from 'src/modules/auctions/models/AuctionStatus.enum';
import FilterQueryBuilder from 'src/modules/FilterQueryBuilder';
import { Sort, Sorting } from 'src/modules/filtersTypes';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QueryRequest, TrendingQueryRequest } from '../../modules/QueryRequest';
import { AuctionEntity } from './auction.entity';

@Injectable()
export class AuctionsServiceDb {
  constructor(
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

  async getTrendingAuctions(
    queryRequest: TrendingQueryRequest,
  ): Promise<[AuctionEntity[], number]> {
    return await this.auctionsRepository
      .createQueryBuilder('a')
      .innerJoin('orders', 'o', 'o.auctionId=a.id')
      .where(
        `a.status <> 'Ended' AND a.status <> 'Closed' AND o.creationDate  
        BETWEEN '${this.getSqlDate(queryRequest.startDate)}' 
        AND '${this.getSqlDate(queryRequest.endDate)}'`,
      )
      .groupBy('a.id')
      .orderBy('COUNT(a.Id)', 'DESC')
      .offset(queryRequest.offset)
      .limit(queryRequest.limit)
      .getManyAndCount();
  }

  async getAuctionsOrderByOrdersCount(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      queryRequest.filters,
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    queryBuilder
      .innerJoin('orders', 'o', 'o.auctionId=AuctionEntity.id')
      .groupBy('AuctionEntity.id')
      .orderBy('COUNT(AuctionEntity.Id)', 'DESC')
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

  async insertAuction(auction: AuctionEntity | any): Promise<AuctionEntity> {
    return await this.auctionsRepository.save(auction);
  }

  async updateAuction(
    auctionId: number,
    status: AuctionStatusEnum,
  ): Promise<AuctionEntity> {
    let auction = await this.getAuction(auctionId);
    if (auction) {
      auction.status = status;
      return await this.auctionsRepository.save(auction);
    }
    return null;
  }

  private getSqlDate(date: Date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  private addOrderBy(
    sorting: Sorting[],
    queryBuilder: SelectQueryBuilder<AuctionEntity>,
  ) {
    sorting?.forEach((sort) =>
      queryBuilder.addOrderBy(
        sort.field,
        Sort[sort.direction] === 'ASC' ? 'ASC' : 'DESC',
      ),
    );
  }
}
