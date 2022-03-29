import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ReportNftEntity, ReportNftsRepository } from 'src/db/reportNft';

@Injectable()
export class ReportNftsService {
  constructor(
    private reportNftsRepo: ReportNftsRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async addReport(identifier: string, address: string): Promise<boolean> {
    try {
      const isReported = await this.reportNftsRepo.isReportedBy(
        identifier,
        address,
      );
      if (isReported) {
        return true;
      }
      await this.reportNftsRepo.addReport(
        new ReportNftEntity({ identifier, address }),
      );
      return true;
    } catch (err) {
      this.logger.error('An error occurred while adding Asset Like.', {
        path: 'ReportNftsService.addReport',
        identifier,
        address,
        exception: err,
      });
      return await this.reportNftsRepo.isReportedBy(identifier, address);
    }
  }
}
