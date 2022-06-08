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
      if (err.errno === 1062) {
        return null;
      }
      throw err;
    }
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
