import { Module } from '@nestjs/common';
import {
  ElrondApiService,
  ElrondElasticService,
  ElrondIdentityService,
  ElrondProxyService,
  ElrondDataService,
} from 'src/common';

@Module({
  providers: [
    ElrondProxyService,
    ElrondApiService,
    ElrondElasticService,
    ElrondIdentityService,
    ElrondDataService,
  ],
  exports: [
    ElrondProxyService,
    ElrondApiService,
    ElrondElasticService,
    ElrondIdentityService,
    ElrondDataService,
  ],
})
export class ElrondCommunicationModule {}
