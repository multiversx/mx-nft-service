import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

@Injectable()
export class DisabledMarketplaceEventsService {
  constructor(private redisCacheService: RedisCacheService) {}

  public async handleAuctionEventsForDisableMarketplace(auctionEvents: any[], hash: string) {
    if (auctionEvents?.length) {
      await this.redisCacheService.rpush(CacheInfo.MarketplaceEvents.key, { hash: hash, events: auctionEvents });
    }
  }
}
