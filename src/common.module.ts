import { forwardRef, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import { ScheduleModule } from '@nestjs/schedule';
import { ElrondCommunicationModule } from './common/services/elrond-communication/elrond-communication.module';
import { CachingModule } from './common/services/caching/caching.module';
import { ApiConfigService } from './utils/api.config.service';
import { DynamicModuleUtils } from './utils/dynamic.module-utils';

@Module({
  imports: [
    forwardRef(() => CachingModule),
    ScheduleModule.forRoot(),
    ConfigModule,
    ElrondCommunicationModule,
  ],
  exports: [
    ElrondCommunicationModule,
    CachingModule,
    ApiConfigService,
    DynamicModuleUtils.getNestJsApiConfigService(),
    Logger,
  ],
  providers: [
    ApiConfigService,
    DynamicModuleUtils.getNestJsApiConfigService(),
    Logger,
  ],
})
export class CommonModule {}
