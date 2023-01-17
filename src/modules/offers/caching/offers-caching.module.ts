import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { CachingModule } from 'src/common/services/caching/caching.module';
import { AccountsStatsCachingService } from 'src/modules/account-stats/accounts-stats.caching.service';
import { OffersCachingService } from './offers-caching.service';

@Module({
  providers: [OffersCachingService, AccountsStatsCachingService],
  imports: [CachingModule, CommonModule],
  exports: [OffersCachingService],
})
export class OffersCachingModule {}
