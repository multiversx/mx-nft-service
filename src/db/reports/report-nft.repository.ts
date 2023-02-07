import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { Repository } from 'typeorm';
import { ReportNftEntity } from './report-nft.entity';

@Injectable()
export class ReportNftsRepository {
  constructor(
    @InjectRepository(ReportNftEntity)
    private reportNftRepository: Repository<ReportNftEntity>,
  ) {}
  async isReportedBy(identifier: string, address: string): Promise<boolean> {
    const count = await this.reportNftRepository.count({
      where: {
        identifier,
        address,
      },
    });

    return count > 0;
  }

  async addReport(reportEntity: ReportNftEntity): Promise<ReportNftEntity> {
    try {
      return await this.reportNftRepository.save(reportEntity);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }

  async clearReport(identifier: string): Promise<boolean> {
    const response = await this.reportNftRepository.delete({
      identifier: identifier,
    });
    if (response?.affected > 0) {
      return true;
    }
    return false;
  }

  async getReportCount(identifier: string): Promise<number> {
    try {
      return await this.reportNftRepository.count({
        where: {
          identifier,
        },
      });
    } catch (err) {
      throw err;
    }
  }
}
