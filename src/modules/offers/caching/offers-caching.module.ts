import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { OffersCachingService } from './offers-caching.service';

@Module({
  providers: [OffersCachingService],
  imports: [CommonModule],
  exports: [OffersCachingService],
})
export class OffersCachingModule {}
