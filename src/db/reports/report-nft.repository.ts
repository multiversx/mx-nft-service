import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { EntityRepository, Repository } from 'typeorm';
import { ReportNftEntity } from './report-nft.entity';

@EntityRepository(ReportNftEntity)
export class ReportNftsRepository extends Repository<ReportNftEntity> {
  async isReportedBy(identifier: string, address: string): Promise<boolean> {
    const count = await this.count({
      where: {
        identifier,
        address,
      },
    });

    return count > 0;
  }

  async addReport(reportEntity: ReportNftEntity): Promise<ReportNftEntity> {
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

  async clearReport(identifier: string): Promise<boolean> {
    const response = await this.delete({ identifier: identifier });
    if (response?.affected > 0) {
      return true;
    }
    return false;
  }

  async getReportCount(identifier: string): Promise<number> {
    try {
      return await this.count({
        where: {
          identifier,
        },
      });
    } catch (err) {
      throw err;
    }
  }
}
