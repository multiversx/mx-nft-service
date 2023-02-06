import { EntityRepository, Repository } from 'typeorm';
import { NftRarityEntity } from './nft-rarity.entity';

@EntityRepository(NftRarityEntity)
export class NftRarityRepository extends Repository<NftRarityEntity> {
  async saveOrUpdateBulk(nftRarities: NftRarityEntity[]): Promise<void> {
    await this.createQueryBuilder()
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
    const res = await this.createQueryBuilder()
      .select('collection')
      .distinct(true)
      .execute();
    return res.map((nft) => nft.collection);
  }

  async getBulkRarities(identifiers: string[]): Promise<NftRarityEntity[]> {
    return await this.createQueryBuilder()
      .where(`identifier IN(:identifiers)`, {
        identifiers: identifiers,
      })
      .getMany();
  }

  async findNftRarityByCollection(
    collectionTicker: string,
  ): Promise<NftRarityEntity[]> {
    return (
      await this.find({
        where: { collection: collectionTicker },
      })
    ).sort((a, b) => b.nonce - a.nonce);
  }

  async deleteNftRarity(identifier: string): Promise<any> {
    return await this.delete({ identifier: identifier });
  }
}
