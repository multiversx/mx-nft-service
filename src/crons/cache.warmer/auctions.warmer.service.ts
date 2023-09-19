import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { ClientProxy } from '@nestjs/microservices';
import { Constants, Locker } from '@multiversx/sdk-nestjs-common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';

import { AuctionsGetterService } from 'src/modules/auctions';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';

@Injectable()
export class AuctionsWarmerService {
  constructor(
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private auctionsGetterService: AuctionsGetterService,
    private cacheService: CacheService,
    private marketplacesService: MarketplacesService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCachingForFeaturedCollections() {
    await Locker.lock(
      'Featured collection auctions',
      async () => {
        const collections = await this.marketplacesService.getAllCollectionsIdentifiersFromDb();

        for (const collection of collections) {
          const auctionResult = await this.auctionsGetterService.getAuctionsByCollection(collection);

          await this.invalidateKey(`collectionAuctions:${collection}`, auctionResult, 10 * Constants.oneMinute());
        }
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCachingForPaymentTokensCollections() {
    await Locker.lock(
      'Payment tokens auctions',
      async () => {
        const paymentTokens = await this.auctionsGetterService.getCurrentPaymentTokens();

        for (const paymentToken of paymentTokens) {
          const auctionResult = await this.auctionsGetterService.getAuctionsByPaymentToken(paymentToken.identifier);

          await this.invalidateKey(`paymentTokenAuctions:${paymentToken.identifier}`, auctionResult, 10 * Constants.oneMinute());
        }
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCachingForActiveAuctions() {
    await Locker.lock(
      'Active auctions',
      async () => {
        const auctionResult = await this.auctionsGetterService.getActiveAuctions();

        await this.invalidateKey(CacheInfo.ActiveAuctions.key, auctionResult, CacheInfo.ActiveAuctions.ttl);
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCachingForBuyNowAuctions() {
    await Locker.lock(
      'Buy now auctions',
      async () => {
        const auctionResult = await this.auctionsGetterService.getBuyNowAuctions();

        await this.invalidateKey(CacheInfo.BuyNowAuctions.key, auctionResult, CacheInfo.BuyNowAuctions.ttl);
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAuctionsOrderByNoBids() {
    await Locker.lock(
      'Top auctions order by number of bids',
      async () => {
        const result = await this.auctionsGetterService.getTopAuctionsOrderByNoBids();

        await this.invalidateKey(CacheInfo.TopAuctionsOrderByNoBids.key, result, CacheInfo.TopAuctionsOrderByNoBids.ttl);
      },
      true,
    );
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cacheService.set(key, data, ttl);
    await this.refreshCacheKey(key, ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    await this.clientProxy.emit('refreshCacheKey', {
      key,
      ttl,
    });
  }
}
