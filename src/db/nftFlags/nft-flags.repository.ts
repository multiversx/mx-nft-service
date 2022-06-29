import { EntityRepository, Repository } from 'typeorm';
import { NftFlagsEntity } from './nft-flags.entity';

@EntityRepository(NftFlagsEntity)
export class NftsFlagsRepository extends Repository<NftFlagsEntity> {
  async isReportedBy(identifier: string, address: string): Promise<boolean> {
    const count = await this.count({
      where: {
        identifier,
        address,
      },
    });

    return count > 0;
  }

  async addFlag(flagEntity: NftFlagsEntity): Promise<NftFlagsEntity> {
    try {
      return await this.save(flagEntity);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === 1062) {
        return null;
      }
      throw err;
    }
  }

  async getDetails(identifier: string): Promise<NftFlagsEntity> {
    try {
      return await this.findOne({
        where: {
          identifier,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async batchGetFlags(identifiers: string[]): Promise<Record<string, any>> {
    try {
      return await this.find({
        where: {
          identifier: { in: identifiers },
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async getTotalCount(): Promise<number> {
    try {
      return await this.count();
    } catch (err) {
      throw err;
    }
  }
}
