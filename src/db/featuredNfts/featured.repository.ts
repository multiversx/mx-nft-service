import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { EntityRepository, Repository } from 'typeorm';
import { FeaturedCollectionEntity, FeaturedNftEntity } from './featured.entity';

@EntityRepository(FeaturedNftEntity)
export class FeaturedNftsRepository extends Repository<FeaturedNftEntity> {
  async getFeaturedNfts(
    limit: number = 20,
    offset: number = 0,
  ): Promise<[FeaturedNftEntity[], number]> {
    const featuredNfts = await this.createQueryBuilder('featuredNfts')
      .innerJoin('auctions', 'a', 'featuredNfts.identifier=a.identifier')
      .where(`a.status='${AuctionStatusEnum.Running}'`)
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return featuredNfts;
  }

  async getFeaturedCollections(
    limit: number = 20,
    offset: number = 0,
  ): Promise<[FeaturedNftEntity[], number]> {
    const featuredNfts = await this.createQueryBuilder('featuredCollections')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return featuredNfts;
  }
}

@EntityRepository(FeaturedCollectionEntity)
export class FeaturedCollectionsRepository extends Repository<FeaturedCollectionEntity> {
  async getFeaturedCollections(
    limit: number = 20,
    offset: number = 0,
  ): Promise<[FeaturedNftEntity[], number]> {
    const featuredCollections = await this.createQueryBuilder(
      'featuredCollections',
    )
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return featuredCollections;
  }
}
