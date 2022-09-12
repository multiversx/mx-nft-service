import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { removeCredentialsFromUrl } from 'src/utils/helpers';
import { Logger } from 'winston';
import { ApiService } from './api.service';
import { ApiSettings } from './models/api-settings';

@Injectable()
export class SlackReportService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly apiService: ApiService,
  ) {}

  async sendReport(identifier: string, count: number): Promise<boolean> {
    const url = process.env.SLACK_API;
    const marketplaceUrl = new URL(
      `${process.env.ELROND_MARKETPLACE}\\nfts\\${identifier}`,
    );
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
      this.logger.error(
        `An error occurred while calling the slack report service on url ${removeCredentialsFromUrl(
          url,
        )}`,
        {
          path: 'SlackReportService.sendReport',
          identifier,
          exception: error,
        },
      );
      return;
    }
  }
}
