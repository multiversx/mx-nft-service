import { Controller, Logger } from '@nestjs/common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class PubSubListenerController {
  private logger: Logger;
  constructor(private readonly cacheService: CacheService) {
    this.logger = new Logger(PubSubListenerController.name);
  }

  @EventPattern('deleteCacheKeys')
  async deleteCacheKey(keys: string[]) {
    for (const key of keys) {
      this.logger.log(`Deleting local cache key ${key}`);
      await this.cacheService.deleteInCache(key);
    }
  }

  @EventPattern('refreshCacheKey')
  async refreshCacheKey(@Payload() event: { key: string; ttl: number }) {
    this.logger.log(`Refreshing local cache key ${event.key} with ttl ${event.ttl}`);
    await this.cacheService.refreshLocal(event.key, event.ttl);
  }
}
