import { Module } from '@nestjs/common';
import { ElrondProxyService } from './elrond-proxy.service';
import { ElrondApiService } from './elrond-api.service';

@Module({
  providers: [ElrondProxyService, ElrondApiService],
  exports: [ElrondProxyService, ElrondApiService],
})
export class ElrondCommunicationModule {}
