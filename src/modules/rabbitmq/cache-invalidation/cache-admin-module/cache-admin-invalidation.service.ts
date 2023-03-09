import { CachingService } from '@multiversx/sdk-nestjs';
import { Injectable, Logger } from '@nestjs/common';
import { ChangedEvent } from '../events/changed.event';

@Injectable()
export class CacheInvalidationAdminService {
  constructor(
    private readonly logger: Logger,
    private readonly cachingService: CachingService,
  ) {}

  async deleteCacheKeys(input: ChangedEvent) {
    this.logger.log(`Deleting cache key(s) ${input.id} `);
    for (const key of input.id) {
      await this.cachingService.deleteInCache(key);
    }
  }
}
