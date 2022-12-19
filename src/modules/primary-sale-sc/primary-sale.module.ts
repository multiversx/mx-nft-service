import { forwardRef, Module } from '@nestjs/common';
import { PrimarySaleResolver } from './primary-sale.resolver';
import { CachingService } from 'src/common/services/caching/caching.service';
import { ElrondCommunicationModule } from 'src/common/services/elrond-communication/elrond-communication.module';
import { PrimarySaleService } from './primary-sale.service';
import { CommonModule } from 'src/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [PrimarySaleService, PrimarySaleResolver, CachingService],
  imports: [
    forwardRef(() => ElrondCommunicationModule),
    forwardRef(() => CommonModule),
    forwardRef(() => AuthModule),
  ],
  exports: [PrimarySaleService],
})
export class PrimarySaleModuleGraph {}
