import { Module } from '@nestjs/common';
import {
  ElrondApiService,
  ElrondElasticService,
  ElrondIdentityService,
  ElrondProxyService,
  ElrondDataService,
} from 'src/common';
import { ApiService } from '../api.service';

@Module({
  providers: [
    ApiService,
    ElrondProxyService,
    ElrondApiService,
    ElrondElasticService,
    ElrondIdentityService,
    ElrondDataService,
  ],
  exports: [
    ApiService,
    ElrondProxyService,
    ElrondApiService,
    ElrondElasticService,
    ElrondIdentityService,
    ElrondDataService,
  ],
})
export class ElrondCommunicationModule {}
