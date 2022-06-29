import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ElrondApiService } from './elrond-api.service';
import { ElrondDataService } from './elrond-data.service';
import { ElrondFeedService } from './elrond-feed.service';
import { ElrondIdentityService } from './elrond-identity.service';
import { ElrondProxyService } from './elrond-proxy.service';
import { ElrondStatsService } from './elrond-stats.service';
import { SlackReportService } from './slack-report.service';

@Module({
  providers: [
    ApiService,
    ElrondProxyService,
    ElrondApiService,
    ElrondStatsService,
    ElrondIdentityService,
    ElrondDataService,
    ElrondFeedService,
    SlackReportService,
  ],
  exports: [
    ApiService,
    ElrondProxyService,
    ElrondStatsService,
    ElrondApiService,
    ElrondIdentityService,
    ElrondDataService,
    ElrondFeedService,
    SlackReportService,
  ],
})
export class ElrondCommunicationModule {}
