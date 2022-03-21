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

@Module({
  providers: [
    ApiService,
    ElrondProxyService,
    ElrondApiService,
    ElrondStatsService,
    ElrondElasticService,
    ElrondIdentityService,
    ElrondDataService,
  ],
  exports: [
    ApiService,
    ElrondProxyService,
    ElrondStatsService,
    ElrondApiService,
    ElrondElasticService,
    ElrondIdentityService,
    ElrondDataService,
  ],
})
export class ElrondCommunicationModule {}
