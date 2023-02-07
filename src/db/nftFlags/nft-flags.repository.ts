import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { Repository } from 'typeorm';
import { NftFlagsEntity } from './nft-flags.entity';

@Injectable()
export class NftsFlagsRepository {
  constructor(
    @InjectRepository(NftFlagsEntity)
    private nftFlagsRepository: Repository<NftFlagsEntity>,
  ) {}
  async addFlag(flagEntity: NftFlagsEntity): Promise<NftFlagsEntity> {
    try {
      return await this.nftFlagsRepository.save(flagEntity);
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
      const response = await this.nftFlagsRepository
        .createQueryBuilder()
        .where(`identifier in (${identifiers.map((value) => `'${value}'`)})`)
        .getMany();
      return response.toRecord<NftFlagsEntity[]>((r) => r.identifier);
    } catch (err) {
      throw err;
    }
  }

  async upsertFlags(entities: NftFlagsEntity[]): Promise<any> {
    await this.nftFlagsRepository.upsert(entities, {
      conflictPaths: ['identifier'],
    });
  }

  async updateFlag(flag: NftFlagsEntity): Promise<any> {
    await this.nftFlagsRepository.upsert(flag, {
      conflictPaths: ['identifier'],
    });
  }
}
