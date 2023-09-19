import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlacklistedCollectionEntity } from './blacklisted.entity';

@Injectable()
export class BlacklistedCollectionsRepository {
  constructor(
    @InjectRepository(BlacklistedCollectionEntity)
    private blacklistedCollectionsRepository: Repository<BlacklistedCollectionEntity>,
  ) {}
  async getBlacklistedCollections(): Promise<[BlacklistedCollectionEntity[], number]> {
    const blacklistedCollections = await this.blacklistedCollectionsRepository
      .createQueryBuilder('blacklistedCollections')
      .getManyAndCount();
    return blacklistedCollections;
  }

  async addBlacklistedCollection(collection: string): Promise<boolean> {
    const res = await this.blacklistedCollectionsRepository.save(new BlacklistedCollectionEntity({ identifier: collection }));
    return !!res.id;
  }

  async removeBlacklistedCollection(collection: string): Promise<boolean> {
    const res = await this.blacklistedCollectionsRepository.delete({
      identifier: collection,
    });
    return res.affected === 1;
  }
}
