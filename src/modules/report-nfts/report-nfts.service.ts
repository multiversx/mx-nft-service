import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ReportNftEntity, ReportNftsRepository } from 'src/db/reportNft';
import { SlackReportService } from 'src/common/services/elrond-communication/slack-report.service';
import { PersistenceService } from 'src/common/persistance/persistance.service';

@Injectable()
export class ReportNftsService {
  constructor(
    private persistenceService: PersistenceService,
    private slackReport: SlackReportService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async addReport(identifier: string, address: string): Promise<boolean> {
    try {
      const isReported = await this.persistenceService.isReportedBy(
        identifier,
        address,
      );
      if (isReported) {
        return true;
      }

      await this.persistenceService.addReport(
        new ReportNftEntity({ identifier, address }),
      );
      await this.sendReportMessage(identifier);
      return true;
    } catch (err) {
      this.logger.error('An error occurred while adding Asset Like.', {
        path: 'ReportNftsService.addReport',
        identifier,
        address,
        exception: err,
      });
      return await this.persistenceService.isReportedBy(identifier, address);
    }
  }

  private async sendReportMessage(identifier: string) {
    const reportCount = await this.persistenceService.getReportCount(
      identifier,
    );
    if (reportCount >= parseInt(process.env.REPORT_TRESHOLD)) {
      await this.slackReport.sendReport(identifier, reportCount);
    }
  }
}
