import { Controller, Logger } from '@nestjs/common';
import { CachingService } from 'src/common/services/caching/caching.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DeleteCacheKeysInput } from 'src/common/services/caching/entities/deleteCacheInput';
import { SetCacheKeysInput } from 'src/common/services/caching/entities/setCacheInput';

@Controller()
export class PubSubListenerController {
  private logger: Logger;
  constructor(private readonly cachingService: CachingService) {
    this.logger = new Logger(PubSubListenerController.name);
  }

  @EventPattern('deleteCacheKeys')
  async deleteCacheKey(keys: string[]) {
    for (const key of keys) {
      this.logger.log(`Deleting local cache key ${key}`);
      await this.cachingService.deleteInCacheLocal(key);
    }
  }

  @EventPattern('deleteCacheKeysFromClient')
  async deleteCacheKeyFromClient(@Payload() input: DeleteCacheKeysInput) {
    if (input.localOnly) {
      await this.deleteCacheKey(input.keys);
    }

    this.logger.log(
      `Deleting cache key(s) ${input.keys} for ${input.redisClientName}`,
    );
    const client = this.cachingService.getClient(input.redisClientName);
    for (const key of input.keys) {
      await this.cachingService.deleteInCache(client, key);
    }
  }

  @EventPattern('setCacheKeyForClient')
  async setCacheKey(@Payload() input: SetCacheKeysInput) {
    this.logger.log(
      `Setting cache key ${input.key} on client ${input.redisClientName}`,
    );
    const redisClient = this.cachingService.getClient(input.redisClientName);
    await this.cachingService.setCache(
      redisClient,
      input.key,
      input.value,
      input.ttl,
    );
  }

  @EventPattern('refreshCacheKey')
  async refreshCacheKey(
    @Payload() event: { redisClientName: string; key: string; ttl: number },
  ) {
    this.logger.log(
      `Refreshing local cache key ${event.key} with ttl ${event.ttl} and redis client name ${event.redisClientName}`,
    );
    const redisClient = this.cachingService.getClient(event.redisClientName);
    await this.cachingService.refreshCacheLocal(
      redisClient,
      event.key,
      event.ttl,
    );
  }
}
