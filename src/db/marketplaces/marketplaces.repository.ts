import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceEntity } from './marketplace.entity';

@Injectable()
export class MarketplaceRepository {
  constructor(
    @InjectRepository(MarketplaceEntity)
    private marketplaceRepository: Repository<MarketplaceEntity>,
  ) {}
  async getMarketplaces(): Promise<[MarketplaceEntity[], number]> {
    return this.marketplaceRepository.findAndCount();
  }

  async getMarketplaceByAddress(address: string): Promise<MarketplaceEntity> {
    return this.marketplaceRepository.findOne({ where: { address } });
  }

  async getMarketplacesByAddress(address: string): Promise<MarketplaceEntity[]> {
    return this.marketplaceRepository.find({ where: { address } });
  }

  async getMarketplacesByKeys(marketplaceKeys: string[]): Promise<MarketplaceEntity[]> {
    return this.marketplaceRepository
      .createQueryBuilder('marketplaces')
      .where('`key` IN(:...marketplaceKeys)', { marketplaceKeys: marketplaceKeys })
      .getMany();
  }

  async getMarketplaceByKey(marketplaceKey: string): Promise<MarketplaceEntity> {
    return this.marketplaceRepository.findOne({ where: { key: marketplaceKey } });
  }

  async getMarketplacesByAddresses(addresses: string[]): Promise<MarketplaceEntity[]> {
    return this.marketplaceRepository
      .createQueryBuilder('fm')
      .select('fm.address as address')
      .addSelect('fm.url as url')
      .addSelect('fm.name as name')
      .addSelect('fm.key as `key`')
      .addSelect('fm.state as `state`')
      .where('fm.address IN(:...addresses)', {
        addresses: addresses,
      })
      .execute();
  }

  async saveMarketplace(entity: MarketplaceEntity): Promise<MarketplaceEntity> {
    return this.marketplaceRepository.save(entity);
  }

  async saveMarketplaces(entities: MarketplaceEntity[]): Promise<MarketplaceEntity[]> {
    return this.marketplaceRepository.save(entities);
  }

  async updateMarketplace(entity: MarketplaceEntity): Promise<boolean> {
    const result = await this.marketplaceRepository.update({ key: entity.key }, entity);
    return result?.affected === 1;
  }

  async updateMarketplaceLastIndexTimestamp(address: string, lastIndexTimestamp: number): Promise<void> {
    await this.marketplaceRepository.update({ address: address }, { lastIndexTimestamp: lastIndexTimestamp });
  }
}
