import { Injectable, Logger } from '@nestjs/common';
import { ReportNftEntity } from 'src/db/reports';
import { SlackReportService } from 'src/common/services/mx-communication/slack-report.service';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { ReportCollectionEntity } from 'src/db/reports/report-collection.entity';

@Injectable()
export class ReportsService {
  constructor(private persistenceService: PersistenceService, private slackReport: SlackReportService, private readonly logger: Logger) {}

  async addNftReport(identifier: string, address: string): Promise<boolean> {
    try {
      const isReported = await this.persistenceService.isNftReportedBy(identifier, address);
      if (isReported) {
        return true;
      }

      await this.persistenceService.addNftReport(new ReportNftEntity({ identifier, address }));
      await this.sendNftReportMessage(identifier);
      return true;
    } catch (err) {
      this.logger.error('An error occurred while adding a report.', {
        path: `${ReportsService.name}.${this.addNftReport.name}`,
        identifier,
        address,
        exception: err,
      });
      return await this.persistenceService.isNftReportedBy(identifier, address);
    }
  }

  async addCollectionReport(collectionIdentifier: string, address: string): Promise<boolean> {
    try {
      const isReported = await this.persistenceService.isCollectionReportedBy(collectionIdentifier, address);
      if (isReported) {
        return true;
      }

      await this.persistenceService.addCollectionReport(new ReportCollectionEntity({ collectionIdentifier, address }));
      await this.sendCollectionReportMessage(collectionIdentifier);
      return true;
    } catch (err) {
      this.logger.error('An error occurred while adding a report.', {
        path: `${ReportsService.name}.${this.addCollectionReport.name}`,
        identifier: collectionIdentifier,
        address,
        exception: err,
      });
      return await this.persistenceService.isCollectionReportedBy(collectionIdentifier, address);
    }
  }

  async clearNftReport(identifier: string): Promise<boolean> {
    try {
      return await this.persistenceService.clearNftReport(identifier);
    } catch (err) {
      this.logger.error('An error occurred while deleting nft reports for identifier.', {
        path: `${ReportsService.name}.${this.clearNftReport.name}`,
        identifier,
        exception: err,
      });
      return false;
    }
  }

  async clearCollectionReport(identifier: string): Promise<boolean> {
    try {
      return await this.persistenceService.clearCollectionReport(identifier);
    } catch (err) {
      this.logger.error('An error occurred while deleting collection reports for identifier.', {
        path: `${ReportsService.name}.${this.clearCollectionReport.name}`,
        identifier,
        exception: err,
      });
      return false;
    }
  }

  private async sendNftReportMessage(identifier: string) {
    const reportCount = await this.persistenceService.getNftReportCount(identifier);
    if (reportCount >= parseInt(process.env.REPORT_TRESHOLD)) {
      await this.slackReport.sendReport(identifier, reportCount);
    }
  }

  private async sendCollectionReportMessage(identifier: string) {
    const reportCount = await this.persistenceService.getCollectionReportCount(identifier);
    if (reportCount >= parseInt(process.env.REPORT_TRESHOLD)) {
      await this.slackReport.sendReport(identifier, reportCount, 'collections');
    }
  }
}
