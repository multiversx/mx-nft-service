import { Module } from '@nestjs/common';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { BlacklistedCollectionsCachingService } from './blacklisted-collections.caching.service';
import { BlacklistedCollectionsResolver } from './blacklisted-collections.resolver';
import { BlacklistedCollectionsService } from './blacklisted-collections.service';

@Module({
  imports: [CacheEventsPublisherModule],
  providers: [BlacklistedCollectionsService, BlacklistedCollectionsCachingService, BlacklistedCollectionsResolver],
  exports: [BlacklistedCollectionsService],
})
export class BlacklistedCollectionsModule {}
