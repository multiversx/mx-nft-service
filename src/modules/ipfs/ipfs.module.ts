import { Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from '../../common/services/mx-communication/mx-communication.module';
import { PinataService } from './pinata.service';

@Module({
  providers: [Logger, PinataService],
  imports: [MxCommunicationModule],
  exports: [PinataService],
})
export class IpfsModule {}
