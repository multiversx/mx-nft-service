import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuctionStatusEnum } from '../../modules/auctions/models/Auction-status.enum';
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

  async insertAuction(auction: AuctionEntity | any): Promise<AuctionEntity> {
    return await this.auctionsRepository.save(auction);
  }

  async updateAuction(auctionId: number, status: AuctionStatusEnum) {
    let auction = await this.getAuction(auctionId);
    auction.status = status;
    return await this.auctionsRepository.save(auction);
  }
}
