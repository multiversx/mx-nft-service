import { Module } from '@nestjs/common';
import {
  ElrondApiService,
  ElrondElasticService,
  ElrondIdentityService,
  ElrondProxyService,
} from 'src/common';
import { ElrondDataService } from './elrond-data.service';

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
