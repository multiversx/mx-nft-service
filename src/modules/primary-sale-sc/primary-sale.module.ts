import { forwardRef, Module } from '@nestjs/common';
import { PrimarySaleResolver } from './primary-sale.resolver';
import { MxCommunicationModule } from 'src/common/services/mx-communication/mx-communication.module';
import { PrimarySaleService } from './primary-sale.service';
import { CommonModule } from 'src/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [PrimarySaleService, PrimarySaleResolver],
  imports: [forwardRef(() => MxCommunicationModule), forwardRef(() => CommonModule), forwardRef(() => AuthModule)],
  exports: [PrimarySaleService],
})
export class PrimarySaleModuleGraph {}
