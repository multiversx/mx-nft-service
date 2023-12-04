import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { MarketplaceEventsService } from '../marketplace-events.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';

@Injectable()
export class DisabledMarketplaceEventsService {
  constructor(private redisCacheService: RedisCacheService, private readonly marketplaceEventsService: MarketplaceEventsService) {}

  public async handleAuctionEventsForDisableMarketplace(auctionEvents: any[], hash: string) {
    if (auctionEvents?.length) {
      await this.redisCacheService.rpush(CacheInfo.MarketplaceEvents.key, { hash: hash, events: auctionEvents });
    }
  }

  public async handleAuctionFor() {
    const auctionEvents = await this.redisCacheService.lpop(CacheInfo.MarketplaceEvents.key);
    console.log({ auctionEvents: JSON.stringify(auctionEvents) });

    if (auctionEvents?.length) {
      await this.marketplaceEventsService.handleNftAuctionEvents(auctionEvents, 'hash', MarketplaceTypeEnum.Internal);
    }
  }
}
