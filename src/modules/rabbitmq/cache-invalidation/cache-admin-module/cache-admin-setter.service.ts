import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { Injectable, Logger } from '@nestjs/common';
import { ChangedEvent } from '../events/changed.event';

@Injectable()
export class CacheSetterAdminService {
  constructor(private readonly logger: Logger, private readonly cacheService: CacheService) {}

  async setCacheKey(input: ChangedEvent) {
    this.logger.log(`Setting cache key ${input.id} `);
    await this.cacheService.set(input.id, input.extraInfo.value, Number.parseInt(input.extraInfo.ttl));
  }
}
