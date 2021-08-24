import { Module } from '@nestjs/common';
import { ElrondProxyService } from './elrond-proxy.service';
import { ElrondApiService } from './elrond-api.service';
import { ElrondElasticService } from './elrond-elastic.service';

@Module({
  providers: [ElrondProxyService, ElrondApiService, ElrondElasticService],
  exports: [ElrondProxyService, ElrondApiService, ElrondElasticService],
})
export class ElrondCommunicationModule {}
