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
    return await this.marketplaceRepository.findAndCount();
  }

  async getMarketplaceByAddress(address: string): Promise<MarketplaceEntity> {
    return await this.marketplaceRepository.findOne({
      where: {
        address,
      },
    });
  }

  async getMarketplacesByKeys(
    marketplaceKeys: string[],
  ): Promise<MarketplaceEntity[]> {
    return await this.marketplaceRepository
      .createQueryBuilder('marketplaces')
      .where('`key` IN(:...marketplaceKeys)', {
        marketplaceKeys: marketplaceKeys,
      })
      .getMany();
  }

  async getMarketplacesByAddresses(
    addresses: string[],
  ): Promise<MarketplaceEntity[]> {
    return await this.marketplaceRepository
      .createQueryBuilder('fm')
      .select('fm.address as address')
      .addSelect('fm.url as url')
      .addSelect('fm.name as name')
      .addSelect('fm.key as `key`')
      .where('fm.address IN(:...addresses)', {
        addresses: addresses,
      })
      .execute();
  }

  async updateMarketplaceLastIndexTimestamp(
    address: string,
    lastIndexTimestamp: number,
  ): Promise<void> {
    await this.marketplaceRepository.update(
      { address: address },
      { lastIndexTimestamp: lastIndexTimestamp },
    );
  }
}
