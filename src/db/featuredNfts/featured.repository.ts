import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { FeaturedCollectionTypeEnum } from 'src/modules/featured/FeatureCollectionType.enum';
import { Repository } from 'typeorm';
import { FeaturedCollectionEntity, FeaturedNftEntity } from './featured.entity';

@Injectable()
export class FeaturedNftsRepository {
  constructor(
    @InjectRepository(FeaturedNftEntity)
    private featuredNftsRepository: Repository<FeaturedNftEntity>,
  ) {}
  async getFeaturedNfts(limit: number = 20, offset: number = 0): Promise<[FeaturedNftEntity[], number]> {
    return await this.featuredNftsRepository
      .createQueryBuilder('featuredNfts')
      .innerJoin('auctions', 'a', 'featuredNfts.identifier=a.identifier')
      .where(`a.status= :status`, {
        status: AuctionStatusEnum.Running,
      })
      .orderBy('featuredCollections.id', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }
}

@Injectable()
export class FeaturedCollectionsRepository {
  constructor(
    @InjectRepository(FeaturedCollectionEntity)
    private featuredCollectionsRepository: Repository<FeaturedCollectionEntity>,
  ) {}

  async getFeaturedCollections(limit: number = 20, offset: number = 0): Promise<[FeaturedCollectionEntity[], number]> {
    return await this.featuredCollectionsRepository
      .createQueryBuilder('featuredCollections')
      .orderBy('featuredCollections.id', 'DESC')
      .skip(0)
      .take(100)
      .getManyAndCount();
  }

  async removeFeaturedCollection(collection: string, type: FeaturedCollectionTypeEnum): Promise<boolean> {
    const res = await this.featuredCollectionsRepository.delete({
      identifier: collection,
      type: type,
    });
    return res.affected === 1;
  }

  async addFeaturedCollection(collection: string, type: FeaturedCollectionTypeEnum): Promise<boolean> {
    if (!collection) return false;
    const res = await this.featuredCollectionsRepository.save(new FeaturedCollectionEntity({ identifier: collection, type }));
    return !!res.id;
  }

  async getFeaturedCollectionsByIdentifiers(identifiers: string[]): Promise<FeaturedCollectionEntity[]> {
    return await this.featuredCollectionsRepository
      .createQueryBuilder('featuredCollections')
      .where('identifier IN(:...identifiers)', {
        identifiers: identifiers,
      })
      .getMany();
  }

  async getTicketCollectionsByIdentifiers(identifiers: string[]): Promise<FeaturedCollectionEntity[]> {
    return await this.featuredCollectionsRepository
      .createQueryBuilder('featuredCollections')
      .where('identifier IN(:...identifiers)', {
        identifiers: identifiers,
      })
      .andWhere({ type: FeaturedCollectionTypeEnum.Tickets })
      .getMany();
  }
}
