import { Module } from '@nestjs/common';
import { CommonModule } from './common.module';
import { MetricsController } from './modules/metrics/metrics.controller';

@Module({
  imports: [CommonModule],
  controllers: [MetricsController],
  providers: [],
})
export class PrivateAppModule {}
