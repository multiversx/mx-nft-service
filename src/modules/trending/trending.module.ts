import { Module } from '@nestjs/common';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { TrendingResolver } from './trending.resolver';
import { TrendingService } from './trending.service';

@Module({
  providers: [RedisCacheService, TrendingService, TrendingResolver],
  imports: [ElrondCommunicationModule],
  exports: [RedisCacheService],
})
export class TrendingModuleGraph {}
