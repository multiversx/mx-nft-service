import { Module } from '@nestjs/common';
import {
  ElrondApiService,
  ElrondElasticService,
  ElrondIdentityService,
  ElrondProxyService,
  ElrondDataService,
  ElrondStatsService,
} from 'src/common';
import { ApiService } from '../api.service';
import { ElrondFeedService } from './elrond-feed.service';

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
