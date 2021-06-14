import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuctionStatusEnum } from 'src/modules/auctions/models/AuctionStatus.enum';
import FilterQueryBuilder from 'src/modules/FilterQueryBuilder';
import { FiltersExpression } from 'src/modules/filtersTypes';
import { Repository, SelectQueryBuilder } from 'typeorm';
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
    limit: number = 50,
    offset: number,
    filters: FiltersExpression,
  ): Promise<[AuctionEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(
      this.auctionsRepository,
      filters,
    );
    const queryBuilder: SelectQueryBuilder<AuctionEntity> =
      filterQueryBuilder.build();
    queryBuilder.offset(offset);
    queryBuilder.limit(limit);

    return await queryBuilder.getManyAndCount();
  }

  async getAuction(id: number): Promise<AuctionEntity> {
    return await this.auctionsRepository.findOne({
      where: [{ id: id }],
    });
  }

  async getActiveAuction(token: string, nonce: number): Promise<AuctionEntity> {
    return await this.auctionsRepository
      .createQueryBuilder('auction')
      .where(
        `auction.token = :id and auction.nonce = :nonce and auction.status='Running'`,
        {
          id: token,
          nonce: nonce,
        },
      )
      .getOne();
  }

  async insertAuction(auction: AuctionEntity | any): Promise<AuctionEntity> {
    return await this.auctionsRepository.save(auction);
  }

  async updateAuction(auctionId: number, status: AuctionStatusEnum) {
    let auction = await this.getAuction(auctionId);
    auction.status = status;
    return await this.auctionsRepository.save(auction);
  }
}
