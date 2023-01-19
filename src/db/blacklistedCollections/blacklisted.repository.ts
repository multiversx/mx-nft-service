import { EntityRepository, Repository } from 'typeorm';
import { BlacklistedCollectionEntity } from './blacklisted.entity';

@EntityRepository(BlacklistedCollectionEntity)
export class BlacklistedCollectionsRepository extends Repository<BlacklistedCollectionEntity> {
  async getBlacklistedCollections(): Promise<
    [BlacklistedCollectionEntity[], number]
  > {
    const blacklistedCollections = await this.createQueryBuilder(
      'blacklistedCollections',
    ).getManyAndCount();
    return blacklistedCollections;
  }
}
