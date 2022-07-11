import { EntityRepository, Repository } from 'typeorm';
import { NftRarityEntity } from './nft-rarity.entity';

@EntityRepository(NftRarityEntity)
export class NftRarityRepository extends Repository<NftRarityEntity> {
  async saveOrUpdateBulk(
    nftRarities: NftRarityEntity[],
  ): Promise<NftRarityEntity[]> {
    await this.delete({ collection: nftRarities[0].collection });
    await new Promise((resolve) => setTimeout(resolve, 100));
    return await this.save(nftRarities);
  }
}
