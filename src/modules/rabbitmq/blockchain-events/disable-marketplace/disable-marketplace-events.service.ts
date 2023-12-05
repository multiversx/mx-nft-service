import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { MarketplaceEventsService } from '../marketplace-events.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';

@Injectable()
export class DisabledMarketplaceEventsService {
  constructor(private redisCacheService: RedisCacheService, private readonly marketplaceEventsService: MarketplaceEventsService) {}

  public async handleAuctionEventsForDisableMarketplace(auctionEvents: any[], hash: string) {
    if (auctionEvents?.length) {
      await this.redisCacheService.rpush(CacheInfo.MarketplaceEvents.key, JSON.stringify([{ hash: hash, events: auctionEvents }]));
    }
  }

  public async handleAuctionFor() {
    const events = await this.redisCacheService.lpop(CacheInfo.MarketplaceEvents.key);
    const parseEvents = JSON.parse(events[0]);
    const auctionsEvents = parseEvents[0];
    if (auctionsEvents?.events?.length) {
      await this.marketplaceEventsService.handleNftAuctionEvents(auctionsEvents?.events, auctionsEvents.hash, MarketplaceTypeEnum.Internal);
    }
  }
}
