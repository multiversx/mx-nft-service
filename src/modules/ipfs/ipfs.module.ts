import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { PinataService } from './pinata.service';

@Module({
  providers: [PinataService],
  imports: [ElrondCommunicationModule],
  exports: [PinataService],
})
export class IpfsModule {}
