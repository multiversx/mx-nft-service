import { forwardRef, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import { ScheduleModule } from '@nestjs/schedule';
import { MxCommunicationModule } from './common/services/mx-communication/mx-communication.module';
import { CachingModule } from './common/services/caching/caching.module';
import { ApiConfigService } from './modules/common/api-config/api.config.service';
import { DynamicModuleUtils } from './utils/dynamicModule-utils';

@Module({
  imports: [
    forwardRef(() => CachingModule),
    ScheduleModule.forRoot(),
    ConfigModule,
    MxCommunicationModule,
    DynamicModuleUtils.getCachingModule(),
  ],
  exports: [MxCommunicationModule, CachingModule, ApiConfigService, Logger],
  providers: [ApiConfigService, Logger],
})
export class CommonModule {}
