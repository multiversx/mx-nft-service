import { Injectable } from '@nestjs/common';
import { SlackReportService } from 'src/common/services/elrond-communication/slack-report.service';

@Injectable()
export class MarketplaceScUpgradeEventHandler {
  constructor(private readonly slackReportService: SlackReportService) {}

  public async handleMarketplaceScUpgradeEvents(event: any): Promise<void> {
    await this.slackReportService.sendScUpgradeNotification(event.address);
  }
}
