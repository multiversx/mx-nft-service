import { forwardRef, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import { ScheduleModule } from '@nestjs/schedule';
import { MxCommunicationModule } from './common/services/mx-communication/mx-communication.module';
import { CacheModule } from './common/services/caching/caching.module';

@Module({
  imports: [
    forwardRef(() => CacheModule),
    ScheduleModule.forRoot(),
    ConfigModule,
    MxCommunicationModule,
  ],
  exports: [MxCommunicationModule, CacheModule, Logger],
  providers: [Logger],
})
export class CommonModule {}
