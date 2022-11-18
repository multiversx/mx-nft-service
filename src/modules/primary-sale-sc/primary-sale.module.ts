import { forwardRef, Logger, Module } from '@nestjs/common';
import { PrimarySaleResolver } from './primary-sale.resolver';
import { CachingService } from 'src/common/services/caching/caching.service';
import { ElrondCommunicationModule } from 'src/common/services/elrond-communication/elrond-communication.module';
import { PrimarySaleService } from './primary-sale.service';

@Module({
  providers: [Logger, PrimarySaleService, PrimarySaleResolver, CachingService],
  imports: [forwardRef(() => ElrondCommunicationModule)],
  exports: [PrimarySaleService],
})
export class PrimarySaleModuleGraph {}
