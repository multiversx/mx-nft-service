import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ElrondApiService } from './elrond-api.service';
import { ElrondDataService } from './elrond-data.service';
import { ElrondElasticService } from './elrond-elastic.service';
import { ElrondFeedService } from './elrond-feed.service';
import { ElrondIdentityService } from './elrond-identity.service';
import { ElrondProxyService } from './elrond-proxy.service';
import { ElrondStatsService } from './elrond-stats.service';

@Module({
  providers: [
    ApiService,
    ElrondProxyService,
    ElrondApiService,
    ElrondStatsService,
    ElrondElasticService,
    ElrondIdentityService,
    ElrondDataService,
    ElrondFeedService,
  ],
  exports: [
    ApiService,
    ElrondProxyService,
    ElrondStatsService,
    ElrondApiService,
    ElrondElasticService,
    ElrondIdentityService,
    ElrondDataService,
    ElrondFeedService,
  ],
})
export class ElrondCommunicationModule {}
