import { Injectable, Logger } from '@nestjs/common';
import { CachingService } from 'src/common/services/caching/caching.service';
import { ChangedEvent } from '../events/changed.event';

@Injectable()
export class CacheSetterAdminService {
  constructor(
    private readonly logger: Logger,
    private readonly cachingService: CachingService,
  ) {}

  async setCacheKey(input: ChangedEvent) {
    this.logger.log(
      `Setting cache key ${input.id} on client ${input.extraInfo.redisClientName}`,
    );
    const redisClient = this.cachingService.getClient(
      input.extraInfo.redisClientName,
    );
    await this.cachingService.setCache(
      redisClient,
      input.id,
      input.extraInfo.value,
      Number.parseInt(input.extraInfo.ttl),
    );
  }
}
