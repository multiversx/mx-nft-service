import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuctionEntity } from './auction.entity';

@Injectable()
export class AuctionsService {
  constructor(
    @InjectRepository(AuctionEntity)
    private auctionsRepository: Repository<AuctionEntity>,
  ) {}

  async getAuctions(): Promise<AuctionEntity[]> {
    return await this.auctionsRepository.find();
  }

  async getAuction(_id: number): Promise<AuctionEntity[]> {
    return await this.auctionsRepository.find({
      select: [
        'auctionId',
        'assetId',
        'minBid',
        'maxBid',
        'creationDate',
        'startDate',
        'endDate',
      ],
      where: [{ id: _id }],
    });
  }

  async updateAuction(asset: AuctionEntity) {
    this.auctionsRepository.save(asset);
  }

  async deleteAuction(asset: AuctionEntity) {
    this.auctionsRepository.delete(asset);
  }
}
