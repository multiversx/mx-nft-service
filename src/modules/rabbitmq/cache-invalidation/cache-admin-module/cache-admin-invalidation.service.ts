import { Injectable, Logger } from '@nestjs/common';
import { CachingService } from 'src/common/services/caching/caching.service';
import { ChangedEvent } from '../events/changed.event';

@Injectable()
export class CacheInvalidationAdminService {
  constructor(
    private readonly logger: Logger,
    private readonly cachingService: CachingService,
  ) {}

  async deleteCacheKeys(input: ChangedEvent) {
    this.logger.log(
      `Deleting cache key(s) ${input.id} for ${input.extraInfo.redisClientName}`,
    );
    const client = this.cachingService.getClient(
      input.extraInfo.redisClientName,
    );
    for (const key of input.id) {
      await this.cachingService.deleteInCache(client, key);
    }
  }
}
