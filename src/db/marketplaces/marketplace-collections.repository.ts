import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { MarketplaceCollectionEntity } from './marketplace-collection.entity';
import { MarketplaceEntity } from './marketplace.entity';

@Injectable()
export class MarketplaceCollectionsRepository {
  constructor(
    @InjectRepository(MarketplaceCollectionEntity)
    private marketplaceCollectionRepository: Repository<MarketplaceCollectionEntity>,
  ) {}
  async getMarketplaceByAddressAndCollection(collection: string, address: string): Promise<MarketplaceEntity[]> {
    return await this.marketplaceCollectionRepository
      .createQueryBuilder('mc')
      .select('mc.collectionIdentifier as collectionIdentifier')
      .addSelect('m.name as name')
      .addSelect('m.url as url')
      .addSelect('m.address as address')
      .addSelect('m.key as `key`')
      .addSelect('m.type as `type`')
      .addSelect('m.acceptedPaymentTokens as acceptedPaymentTokens')
      .leftJoinAndSelect('mc.marketplaces', 'm')
      .where(`mc.collectionIdentifier = '${collection}' and m.address= '${address}'`)
      .execute();
  }

  async getMarketplaceByKeyAndCollection(collection: string, key: string): Promise<MarketplaceEntity[]> {
    return await this.marketplaceCollectionRepository
      .createQueryBuilder('mc')
      .select('mc.collectionIdentifier as collectionIdentifier')
      .addSelect('m.name as name')
      .addSelect('m.url as url')
      .addSelect('m.address as address')
      .addSelect('m.key as `key`')
      .addSelect('m.type as `type`')
      .addSelect('m.acceptedPaymentTokens as acceptedPaymentTokens')
      .leftJoinAndSelect('mc.marketplaces', 'm')
      .where(`mc.collectionIdentifier = '${collection}' and m.key= '${key}'`)
      .execute();
  }

  async getAllCollections(): Promise<MarketplaceCollectionEntity[]> {
    return await this.marketplaceCollectionRepository.find();
  }

  async getMarketplaceByCollection(collection: string): Promise<MarketplaceEntity[]> {
    return await this.marketplaceCollectionRepository
      .createQueryBuilder('mc')
      .select('mc.collectionIdentifier as collectionIdentifier')
      .addSelect('m.name as name')
      .addSelect('m.url as url')
      .addSelect('m.address as address')
      .addSelect('m.key as `key`')
      .addSelect('m.type as `type`')
      .addSelect('m.acceptedPaymentTokens as acceptedPaymentTokens')
      .leftJoinAndSelect('mc.marketplaces', 'm')
      .where(`mc.collectionIdentifier = '${collection}'`)
      .execute();
  }

  async getMarketplaceByCollections(collectionIdentifiers: string[]): Promise<any[]> {
    return await this.marketplaceCollectionRepository
      .createQueryBuilder('mc')
      .select('mc.collectionIdentifier as collectionIdentifier')
      .addSelect('m.name as name')
      .addSelect('m.url as url')
      .addSelect('m.address as address')
      .addSelect('m.key as `key`')
      .addSelect('m.type as `type`')
      .addSelect('m.acceptedPaymentTokens as acceptedPaymentTokens')
      .leftJoinAndSelect('mc.marketplaces', 'm')
      .where('mc.collectionIdentifier IN(:...collectionIdentifiers)', {
        collectionIdentifiers: collectionIdentifiers,
      })
      .execute();
  }

  async getCollectionsByMarketplace(marketplaceKey: string): Promise<MarketplaceCollectionEntity[]> {
    return await this.marketplaceCollectionRepository
      .createQueryBuilder('mc')
      .select('mc.collectionIdentifier as collectionIdentifier')
      .leftJoinAndSelect('mc.marketplaces', 'm')
      .where(`m.key = :marketplaceKey`, {
        marketplaceKey: marketplaceKey,
      })
      .execute();
  }

  async getCollectionByIdentifier(collectionIdentifier: string): Promise<MarketplaceCollectionEntity> {
    return this.marketplaceCollectionRepository.findOne({
      where: [{ collectionIdentifier: collectionIdentifier }],
    });
  }

  async getCollectionByKeyAndCollection(collection: string, key: string): Promise<MarketplaceCollectionEntity> {
    return this.marketplaceCollectionRepository
      .createQueryBuilder('mc')
      .select('mc.*')
      .leftJoin('mc.marketplaces', 'm')
      .where(`collectionIdentifier = '${collection}' and m.key= '${key}'`)
      .execute();
  }

  async saveMarketplaceCollection(entity: MarketplaceCollectionEntity): Promise<boolean> {
    const result = await this.marketplaceCollectionRepository.save(entity);
    return result ? true : false;
  }

  async deleteMarketplaceCollection(entity: MarketplaceCollectionEntity): Promise<MarketplaceCollectionEntity> {
    return await this.marketplaceCollectionRepository.remove(entity);
  }
}
