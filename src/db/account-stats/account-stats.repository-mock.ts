import { EntityRepository, Repository } from 'typeorm';
import { AuctionEntity } from '../auctions';

@EntityRepository(AuctionEntity)
export class AccountStatsRepositoryMock extends Repository<AuctionEntity> {
  async getPublicAccountStats(address: string): Promise<any> {
    return {};
  }

  async getOnwerAccountStats(address: string): Promise<any> {
    return {};
  }

  async getAccountClaimableCount(address: string): Promise<any> {
    return 4;
  }
}
