import { Injectable, Logger } from '@nestjs/common';
import { removeCredentialsFromUrl } from 'src/utils/helpers';
import { ApiService } from './api.service';
import { ApiSettings } from './models/api-settings';

@Injectable()
export class SlackReportService {
  constructor(private readonly logger: Logger, private readonly apiService: ApiService) {}

  async sendReport(identifier: string, count: number, type: 'nfts' | 'collections' = 'nfts'): Promise<boolean> {
    const url = process.env.SLACK_API;
    const marketplaceUrl = new URL(`${process.env.ELROND_MARKETPLACE}\\${type}\\${identifier}`);
    try {
      const response = await this.apiService.post(
        url,
        {
          channel: process.env.REPORT_CHANNEL,
          text: `${marketplaceUrl.toString()}\nReport count: ${count}`,
        },
        new ApiSettings({
          authorization: `Bearer ${process.env.REPORT_BEARER}`,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`An error occurred while calling the slack report service on url ${removeCredentialsFromUrl(url)}`, {
        path: 'SlackReportService.sendReport',
        identifier,
        exception: error,
      });
      return;
    }
  }

  async sendScUpgradeNotification(marketplaceAddress: string): Promise<void> {
    const url = process.env.SLACK_API;
    try {
      await this.apiService.post(
        url,
        {
          channel: process.env.ALERT_CHANNEL,
          text: `SCUpgrade event for ${marketplaceAddress} on ${process.env.NODE_ENV} environment\n`,
        },
        new ApiSettings({
          authorization: `Bearer ${process.env.REPORT_BEARER}`,
        }),
      );
    } catch (error) {
      this.logger.error(
        `An error occurred while sending slack notification for marketplace SCUpgrade event url ${removeCredentialsFromUrl(url)}`,
        {
          path: 'SlackReportService.sendScUpgradeNotification',
          marketplaceAddress,
          exception: error.message,
        },
      );
    }
  }
}
