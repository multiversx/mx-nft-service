import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { EntityRepository, Repository } from 'typeorm';
import { FeaturedNftEntity } from './featuredNft.entity';

@EntityRepository(FeaturedNftEntity)
export class FeaturedNftsRepository extends Repository<FeaturedNftEntity> {
  async getFeaturedNftsByIdentifiers(
    limit: number = 20,
    offset: number = 0,
    identifiers: string[],
  ): Promise<[FeaturedNftEntity[], number]> {
    const featuredNfts = await this.createQueryBuilder('featuredNfts')
      .innerJoin('auctions', 'a', 'featuredNfts.identifier=a.identifier')
      .where('identifier in (:identifiers)', { identifiers: identifiers })
      .andWhere(`a.status='${AuctionStatusEnum.Running}'`)
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return featuredNfts;
  }

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
}
