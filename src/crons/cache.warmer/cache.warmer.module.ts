import { Module } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { CommonModule } from 'src/common.module';
import { CacheService } from 'src/common/services/caching/cache.service';
import { LocalCacheService } from 'src/common/services/caching/local.cache.service';
import { CollectionsNftsCountRedisHandler } from 'src/modules/nftCollections/collection-nfts-count.redis-handler';
import { CollectionsNftsRedisHandler } from 'src/modules/nftCollections/collection-nfts.redis-handler';
import { CollectionsService } from 'src/modules/nftCollections/collection.service';
import { CacheWarmerService } from './cache.warmer.service';

@Module({
  imports: [CommonModule],
  providers: [
    CollectionsService,
    RedisCacheService,
    LocalCacheService,
    CollectionsNftsCountRedisHandler,
    CollectionsNftsRedisHandler,
    CacheService,
    CacheWarmerService,
  ],
  exports: [CommonModule],
})
export class CacheWarmerModule {}
