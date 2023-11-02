import { forwardRef, Global, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import { ScheduleModule } from '@nestjs/schedule';
import { MxCommunicationModule } from './common/services/mx-communication/mx-communication.module';
import { CacheModule } from './common/services/caching/caching.module';
import { ApiConfigModule } from './modules/common/api-config/api.config.module';

@Global()
@Module({
  imports: [forwardRef(() => CacheModule), ScheduleModule.forRoot(), ConfigModule, ApiConfigModule, MxCommunicationModule],
  exports: [MxCommunicationModule, CacheModule, Logger, ApiConfigModule],
  providers: [Logger],
})
export class CommonModule {}
