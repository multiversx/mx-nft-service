import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuctionEntity } from './auction.entity';

@Injectable()
export class AuctionsServiceDb {
  constructor(
    @InjectRepository(AuctionEntity)
    private auctionsRepository: Repository<AuctionEntity>,
  ) { }

  async getAuctions(): Promise<AuctionEntity[]> {
    return await this.auctionsRepository.find();
  }

  async getAuction(id: number): Promise<AuctionEntity[]> {
    return await this.auctionsRepository.find({
      where: [{ id: id }],
    });
  }

  async insertAuction(auction: AuctionEntity): Promise<AuctionEntity> {
    return await this.auctionsRepository.save(auction);
  }

  async updateAuction(auction: AuctionEntity) {
    await this.auctionsRepository.update(auction.Id, auction);
  }

  async deleteAuction(auction: AuctionEntity) {
    await this.auctionsRepository.delete(auction);
  }
}
