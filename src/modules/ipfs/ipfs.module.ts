import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { IpfsService as IpfsService } from './ipfs.service';

@Module({
  providers: [IpfsService],
  imports: [ElrondCommunicationModule],
  exports: [IpfsService],
})
export class IpfsModule {}
