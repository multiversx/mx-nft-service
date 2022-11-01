import { EntityRepository, Repository } from 'typeorm';
import { NftScamEntity } from './nft-scam.entity';

@EntityRepository(NftScamEntity)
export class NftScamsRepository extends Repository<NftScamEntity> {
  async saveOrUpdateBulkNftScams(nftScams: NftScamEntity[]): Promise<void> {
    await this.createQueryBuilder()
      .insert()
      .into('nft_scams')
      .values(nftScams)
      .orUpdate({
        conflict_target: ['identifier', 'version', 'type', 'info'],
        overwrite: ['version', 'type', 'info'],
      })
      .execute();
  }

  async getBulkNftScams(identifiers: string[]): Promise<NftScamEntity[]> {
    return await this.createQueryBuilder()
      .where(`identifier IN(:identifiers)`, {
        identifiers: identifiers,
      })
      .execute();
  }

  async findNftScamByIdentifier(identifier: string): Promise<NftScamEntity[]> {
    return await this.find({ identifier: identifier });
  }

  async deleteBulkNftScamInfo(identifiers: string[]): Promise<void> {
    const res = await this.createQueryBuilder()
      .delete()
      .from('nft_scams')
      .where(`identifier IN(:identifiers)`, {
        identifiers: identifiers,
      })
      .execute();
  }
}
