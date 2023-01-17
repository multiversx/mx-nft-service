import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { CachingModule } from 'src/common/services/caching/caching.module';
import { OffersCachingService } from './offers-caching.service';

@Module({
  providers: [OffersCachingService],
  imports: [CachingModule, CommonModule],
  exports: [OffersCachingService],
})
export class OffersCachingModule {}
