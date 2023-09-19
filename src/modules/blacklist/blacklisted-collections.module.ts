import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { BlacklistedCollectionsCachingService } from './blacklisted-collections.caching.service';
import { BlacklistedCollectionsResolver } from './blacklisted-collections.resolver';
import { BlacklistedCollectionsService } from './blacklisted-collections.service';

@Module({
  imports: [CommonModule, PersistenceModule, CacheEventsPublisherModule],
  providers: [BlacklistedCollectionsService, BlacklistedCollectionsCachingService, BlacklistedCollectionsResolver],
  exports: [BlacklistedCollectionsService],
})
export class BlacklistedCollectionsModule {}
