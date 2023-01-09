import { forwardRef, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import { ScheduleModule } from '@nestjs/schedule';
import { MxCommunicationModule } from './common/services/mx-communication/mx-communication.module';
import { CachingModule } from './common/services/caching/caching.module';
import { ApiConfigService } from './utils/api.config.service';

@Module({
  imports: [
    forwardRef(() => CachingModule),
    ScheduleModule.forRoot(),
    ConfigModule,
    MxCommunicationModule,
  ],
  exports: [MxCommunicationModule, CachingModule, ApiConfigService, Logger],
  providers: [ApiConfigService, Logger],
})
export class CommonModule {}
