import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { DateUtils } from 'src/utils/date-utils';

@Injectable()
export class AnalyticsEventsService {
  private readonly logger = new Logger(AnalyticsEventsService.name);

  constructor(private analyticsService: AnalyticsService) {}

  public async handleBuyEvents(auctionEvents: any[]) {
    this.analyticsService.processEvents(auctionEvents, DateUtils.getCurrentTimestamp(), DateUtils.getCurrentTimestamp(), true);
  }
}
