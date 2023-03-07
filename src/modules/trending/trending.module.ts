import { Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { TrendingResolver } from './trending.resolver';
import { TrendingService } from './trending.service';

@Module({
  providers: [Logger, TrendingService, TrendingResolver],
  imports: [MxCommunicationModule],
})
export class TrendingModuleGraph {}
