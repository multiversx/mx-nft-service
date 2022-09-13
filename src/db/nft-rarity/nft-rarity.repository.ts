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
        conflict_target: ['rank', 'score', 'nonce'],
        overwrite: ['rank', 'score', 'nonce'],
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
      .select('identifier, score, `rank`')
      .where(`identifier IN(:identifiers)`, {
        identifiers: identifiers,
      })
      .execute();
  }
}
