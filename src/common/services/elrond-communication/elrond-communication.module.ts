import { Logger, Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ElrondApiService } from './elrond-api.service';
import { ElrondToolsService } from './elrond-tools.service';
import { ElrondElasticService } from './elrond-elastic.service';
import { ElrondFeedService } from './elrond-feed.service';
import { ElrondIdentityService } from './elrond-identity.service';
import { ElrondPrivateApiService } from './elrond-private-api.service';
import { ElrondProxyService } from './elrond-proxy.service';
import { ElrondStatsService } from './elrond-stats.service';
import { SlackReportService } from './slack-report.service';
import { ApiConfigService } from 'src/utils/api.config.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    Logger,
    ApiService,
    ConfigService,
    ApiConfigService,
    ElrondProxyService,
    ElrondApiService,
    ElrondPrivateApiService,
    ElrondStatsService,
    ElrondElasticService,
    ElrondIdentityService,
    ElrondToolsService,
    ElrondFeedService,
    SlackReportService,
  ],
  exports: [
    ApiService,
    ElrondProxyService,
    ElrondStatsService,
    ElrondElasticService,
    ElrondApiService,
    ElrondPrivateApiService,
    ElrondIdentityService,
    ElrondToolsService,
    ElrondFeedService,
    SlackReportService,
  ],
})
export class ElrondCommunicationModule {}
