import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { Repository } from 'typeorm';
import { ReportCollectionEntity } from './report-collection.entity';

@Injectable()
export class ReportCollectionsRepository {
  constructor(
    @InjectRepository(ReportCollectionEntity)
    private reportCollectionRepository: Repository<ReportCollectionEntity>,
  ) {}
  async isReportedBy(collectionIdentifier: string, address: string): Promise<boolean> {
    const count = await this.reportCollectionRepository.count({
      where: {
        collectionIdentifier,
        address,
      },
    });

    return count > 0;
  }

  async addReport(reportEntity: ReportCollectionEntity): Promise<ReportCollectionEntity> {
    try {
      return await this.reportCollectionRepository.save(reportEntity);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }

  async clearReport(collectionIdentifier: string): Promise<boolean> {
    const response = await this.reportCollectionRepository.delete({
      collectionIdentifier: collectionIdentifier,
    });
    if (response?.affected > 0) {
      return true;
    }
    return false;
  }

  async getReportCount(collectionIdentifier: string): Promise<number> {
    try {
      return await this.reportCollectionRepository.count({
        where: {
          collectionIdentifier,
        },
      });
    } catch (err) {
      throw err;
    }
  }
}
