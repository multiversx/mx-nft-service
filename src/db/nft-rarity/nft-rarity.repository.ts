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
}
