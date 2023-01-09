import { Logger, Module } from '@nestjs/common';
import { MxCommunicationModule, RedisCacheService } from 'src/common';
import { TrendingResolver } from './trending.resolver';
import { TrendingService } from './trending.service';

@Module({
  providers: [Logger, RedisCacheService, TrendingService, TrendingResolver],
  imports: [MxCommunicationModule],
  exports: [RedisCacheService],
})
export class TrendingModuleGraph {}
