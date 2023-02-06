import { CachingService } from '@multiversx/sdk-nestjs';
import { Injectable, Logger } from '@nestjs/common';
import { ChangedEvent } from '../events/changed.event';

@Injectable()
export class CacheSetterAdminService {
  constructor(
    private readonly logger: Logger,
    private readonly cachingService: CachingService,
  ) {}

  async setCacheKey(input: ChangedEvent) {
    this.logger.log(`Setting cache key ${input.id} `);
    await this.cachingService.setCache(
      input.id,
      input.extraInfo.value,
      Number.parseInt(input.extraInfo.ttl),
    );
  }
}
