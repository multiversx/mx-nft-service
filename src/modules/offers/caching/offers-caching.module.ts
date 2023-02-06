import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { CacheModule } from 'src/common/services/caching/caching.module';
import { OffersCachingService } from './offers-caching.service';

@Module({
  providers: [OffersCachingService],
  imports: [CacheModule, CommonModule],
  exports: [OffersCachingService],
})
export class OffersCachingModule {}
