import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { ClientProxy } from '@nestjs/microservices';
import { Locker } from '@multiversx/sdk-nestjs-common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { TagsService } from 'src/modules/tags/tags.service';

@Injectable()
export class TagsWarmerService {
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private tagsService: TagsService,
    private cacheService: CacheService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTagsInvalidations() {
    await Locker.lock(
      'Tags invalidations',
      async () => {
        const tokens = await this.tagsService.getAuctionTagsFromDb();
        await this.invalidateKey(CacheInfo.AuctionTags.key, tokens, CacheInfo.AuctionTags.ttl);
      },
      true,
    );
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cacheService.set(key, data, ttl);
    await this.refreshCacheKey(key, ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    await this.clientProxy.emit<{
      key: string;
      ttl: number;
    }>('refreshCacheKey', {
      key,
      ttl,
    });
  }
}
