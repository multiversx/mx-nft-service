import { forwardRef, Module } from '@nestjs/common';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { CommonModule } from 'src/common.module';
import { LocalCacheService } from 'src/common/services/caching/local.cache.service';
import { CollectionModuleGraph } from 'src/modules/nftCollections/collection.module';
import { CollectionsService } from 'src/modules/nftCollections/collection.service';
import { CacheWarmerService } from './cache.warmer.service';

@Module({
  imports: [CommonModule],
  providers: [
    CollectionsService,
    RedisCacheService,
    LocalCacheService,
    CacheWarmerService,
  ],
  exports: [CommonModule],
})
export class CacheWarmerAuctionsModule {}
