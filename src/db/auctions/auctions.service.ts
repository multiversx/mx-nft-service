import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuctionStatusEnum } from 'src/modules/auctions/models/AuctionStatus.enum';
import { Repository } from 'typeorm';
import { AuctionEntity } from './auction.entity';

@Injectable()
export class AuctionsServiceDb {
  constructor(
    @InjectRepository(AuctionEntity)
    private auctionsRepository: Repository<AuctionEntity>,
  ) {}

  async getAuctions(ownerAddress: string): Promise<AuctionEntity[]> {
    return await this.auctionsRepository.find({
      where: [{ ownerAddress: ownerAddress }],
    });
  }

  async getAuction(id: number): Promise<AuctionEntity> {
    return await this.auctionsRepository.findOne({
      where: [{ id: id }],
    });
  }

  async getActiveAuction(
    tokenIdentifier: string,
    tokenNonce: number,
  ): Promise<AuctionEntity> {
    return await this.auctionsRepository
      .createQueryBuilder('auction')
      .where(
        `auction.token_identifier = :id and auction.token_nonce = :nonce and auction.status='active'`,
        {
          id: tokenIdentifier,
          nonce: tokenNonce,
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
