import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { EntityRepository, Repository } from 'typeorm';
import { ReportCollectionEntity } from './report-collection.entity';

@EntityRepository(ReportCollectionEntity)
export class ReportCollectionsRepository extends Repository<ReportCollectionEntity> {
  async isReportedBy(
    collectionIdentifier: string,
    address: string,
  ): Promise<boolean> {
    const count = await this.count({
      where: {
        collectionIdentifier,
        address,
      },
    });

    return count > 0;
  }

  async addReport(
    reportEntity: ReportCollectionEntity,
  ): Promise<ReportCollectionEntity> {
    try {
      return await this.save(reportEntity);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }

  async clearReport(collectionIdentifier: string): Promise<boolean> {
    const response = await this.delete({
      collectionIdentifier: collectionIdentifier,
    });
    if (response?.affected > 0) {
      return true;
    }
    return false;
  }

  async getReportCount(collectionIdentifier: string): Promise<number> {
    try {
      return await this.count({
        where: {
          collectionIdentifier,
        },
      });
    } catch (err) {
      throw err;
    }
  }
}
