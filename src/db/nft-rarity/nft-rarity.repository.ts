import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NftRarityEntity } from './nft-rarity.entity';

@Injectable()
export class NftRarityRepository {
  constructor(
    @InjectRepository(NftRarityEntity)
    private nftRarityRepository: Repository<NftRarityEntity>,
  ) {}
  async saveOrUpdateBulk(nftRarities: NftRarityEntity[]): Promise<void> {
    await this.nftRarityRepository
      .createQueryBuilder()
      .insert()
      .into('nft_rarities')
      .values(nftRarities)
      .orUpdate({
        conflict_target: [
          'identifier',
          'nonce',
          'score_openRarity',
          'rank_openRarity',
          'score_jaccardDistances',
          'rank_jaccardDistances',
          'score_trait',
          'rank_trait',
          'score_statistical',
          'rank_statistical',
        ],
        overwrite: [
          'score_openRarity',
          'rank_openRarity',
          'score_jaccardDistances',
          'rank_jaccardDistances',
          'score_trait',
          'rank_trait',
          'score_statistical',
          'rank_statistical',
        ],
      })
      .execute();
  }

  async getCollectionIds(): Promise<string[]> {
    const res = await this.nftRarityRepository.createQueryBuilder().select('collection').distinct(true).execute();
    return res.map((nft) => nft.collection);
  }

  async getBulkRarities(identifiers: string[]): Promise<NftRarityEntity[]> {
    return await this.nftRarityRepository
      .createQueryBuilder()
      .where(`identifier IN(:identifiers)`, {
        identifiers: identifiers,
      })
      .getMany();
  }

  async findNftRarityByCollection(collectionTicker: string): Promise<NftRarityEntity[]> {
    return (
      await this.nftRarityRepository.find({
        where: { collection: collectionTicker },
      })
    ).sort((a, b) => b.nonce - a.nonce);
  }

  async deleteNftRarity(identifier: string): Promise<any> {
    return await this.nftRarityRepository.delete({ identifier: identifier });
  }
}
