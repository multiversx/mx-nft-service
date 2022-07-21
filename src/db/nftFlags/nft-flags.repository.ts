import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { EntityRepository, Repository } from 'typeorm';
import { NftFlagsEntity } from './nft-flags.entity';

@EntityRepository(NftFlagsEntity)
export class NftsFlagsRepository extends Repository<NftFlagsEntity> {
  async addFlag(flagEntity: NftFlagsEntity): Promise<NftFlagsEntity> {
    try {
      return await this.save(flagEntity);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }

  async batchGetFlags(identifiers: string[]): Promise<Record<string, any>> {
    try {
      const response = await this.createQueryBuilder()
        .where(`identifier in (${identifiers.map((value) => `'${value}'`)})`)
        .getMany();
      return response.toRecord<NftFlagsEntity[]>((r) => r.identifier);
    } catch (err) {
      throw err;
    }
  }

  async upsertEntities(entities: NftFlagsEntity[]): Promise<any> {
    try {
      await this.upsert(entities, { conflictPaths: ['identifier'] });
    } catch (err) {
      throw err;
    }
  }
}
