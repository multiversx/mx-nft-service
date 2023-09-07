import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { FeaturedCollectionsCachingService } from './featured-caching.service';
import { FeaturedCollectionsResolver } from './featured-collections.resolver';
import { FeaturedNftsResolver } from './featured-nfts.resolver';
import { FeaturedService } from './featured.service';

@Module({
  imports: [CommonModule, PersistenceModule, CacheEventsPublisherModule],
  providers: [FeaturedService, FeaturedNftsResolver, FeaturedCollectionsResolver, FeaturedCollectionsCachingService],
  exports: [FeaturedService],
})
export class FeaturedModuleGraph {}
