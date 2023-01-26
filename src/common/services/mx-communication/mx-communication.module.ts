import { Logger, Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { MxApiService } from './mx-api.service';
import { MxToolsService } from './mx-tools.service';
import { MxElasticService } from './mx-elastic.service';
import { MxFeedService } from './mx-feed.service';
import { MxIdentityService } from './mx-identity.service';
import { MxPrivateApiService } from './mx-private-api.service';
import { MxProxyService } from './mx-proxy.service';
import { MxStatsService } from './mx-stats.service';
import { SlackReportService } from './slack-report.service';
import { ApiConfigService } from 'src/utils/api.config.service';
import { ConfigService } from '@nestjs/config';
import { MxExtrasApiService } from './mx-extras-api.service';

@Module({
  providers: [
    Logger,
    ApiService,
    ConfigService,
    ApiConfigService,
    MxProxyService,
    MxApiService,
    MxPrivateApiService,
    MxStatsService,
    MxElasticService,
    MxIdentityService,
    MxToolsService,
    MxFeedService,
    MxExtrasApiService,
    SlackReportService,
  ],
  exports: [
    ApiService,
    MxProxyService,
    MxStatsService,
    MxElasticService,
    MxApiService,
    MxPrivateApiService,
    MxIdentityService,
    MxToolsService,
    MxFeedService,
    MxExtrasApiService,
    SlackReportService,
  ],
})
export class MxCommunicationModule {}
