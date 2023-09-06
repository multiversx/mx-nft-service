import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { Injectable, Logger } from '@nestjs/common';
import { ChangedEvent } from '../events/changed.event';

@Injectable()
export class CacheInvalidationAdminService {
  constructor(private readonly logger: Logger, private readonly cacheService: CacheService) {}

  async deleteCacheKeys(input: ChangedEvent) {
    this.logger.log(`Deleting cache key(s) ${input.id} `);
    for (const key of input.id) {
      await this.cacheService.deleteInCache(key);
    }
  }
}
