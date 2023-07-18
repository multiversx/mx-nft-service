import { Logger, Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { MxApiService } from './mx-api.service';
import { MxElasticService } from './mx-elastic.service';
import { MxFeedService } from './mx-feed.service';
import { MxIdentityService } from './mx-identity.service';
import { MxPrivateApiService } from './mx-private-api.service';
import { MxProxyService } from './mx-proxy.service';
import { MxStatsService } from './mx-stats.service';
import { SlackReportService } from './slack-report.service';
import { ConfigService } from '@nestjs/config';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';
import { MxDataApiService } from './mx-data.service';
import { MxToolsService } from './mx-tools.service';

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
    MxFeedService,
    SlackReportService,
    MxDataApiService,
    MxToolsService,
  ],
  exports: [
    ApiService,
    MxProxyService,
    MxStatsService,
    MxElasticService,
    MxApiService,
    MxPrivateApiService,
    MxIdentityService,
    MxFeedService,
    SlackReportService,
    MxDataApiService,
    MxToolsService,
  ],
})
export class MxCommunicationModule {}
