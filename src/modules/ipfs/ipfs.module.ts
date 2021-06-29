import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { IpfsService as IpfsService } from './ipfs.service';
import { PinataService } from './pinata.service';

@Module({
  providers: [IpfsService, PinataService],
  imports: [ElrondCommunicationModule],
  exports: [IpfsService, PinataService],
})
export class IpfsModule {}
