import { Module } from '@nestjs/common';
import {
  ElrondApiService,
  ElrondElasticService,
  ElrondIdentityService,
  ElrondProxyService,
} from 'src/common';

@Module({
  providers: [
    ElrondProxyService,
    ElrondApiService,
    ElrondElasticService,
    ElrondIdentityService,
  ],
  exports: [
    ElrondProxyService,
    ElrondApiService,
    ElrondElasticService,
    ElrondIdentityService,
  ],
})
export class ElrondCommunicationModule {}
