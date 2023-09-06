import { Injectable } from '@nestjs/common';
import '../../../utils/extensions';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

import { PriceRange } from 'src/db/auctions/price-range';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { AccountsStatsCachingService } from 'src/modules/account-stats/accounts-stats.caching.service';
import { AssetAuctionsCountRedisHandler } from 'src/modules/assets/loaders/asset-auctions-count.redis-handler';
import { AssetAvailableTokensCountRedisHandler } from 'src/modules/assets/loaders/asset-available-tokens-count.redis-handler';
import { OnSaleAssetsCountForCollectionRedisHandler } from 'src/modules/nftCollections/loaders/onsale-assets-count.redis-handler';
import { AuctionsForAssetRedisHandler } from '../loaders/asset-auctions.redis-handler';
import { LowestAuctionRedisHandler } from '../loaders/lowest-auctions.redis-handler';
import { Auction } from '../models';
import { QueryRequest } from 'src/modules/common/filters/QueryRequest';
import * as hash from 'object-hash';
import { InternalMarketplaceRedisHandler } from 'src/modules/assets/loaders/internal-marketplace.redis-handler';
import { Token } from 'src/modules/usdPrice/Token.model';

@Injectable()
export class AuctionsCachingService {
  constructor(
    private auctionsLoader: AuctionsForAssetRedisHandler,
    private lowestAuctionLoader: LowestAuctionRedisHandler,
    private assetsAuctionsCountLoader: AssetAuctionsCountRedisHandler,
    private onSaleAssetsCount: OnSaleAssetsCountForCollectionRedisHandler,
    private availableTokensCountHandler: AssetAvailableTokensCountRedisHandler,
    private accountStatsCachingService: AccountsStatsCachingService,
    private internalMarketplaceRedisHandler: InternalMarketplaceRedisHandler,
    private redisCacheService: RedisCacheService,
  ) {}

  public async invalidatePersistentCaching(identifier: string, address: string, marketplaceKey: string) {
    const { collection } = getCollectionAndNonceFromIdentifier(identifier);
    return await Promise.all([
      this.accountStatsCachingService.invalidateStats(address),
      this.accountStatsCachingService.invalidateStats(`${address}_${marketplaceKey}`),
      this.auctionsLoader.clearKey(identifier),
      this.lowestAuctionLoader.clearKey(identifier),
      this.assetsAuctionsCountLoader.clearKey(identifier),
      this.onSaleAssetsCount.clearKey(collection),
      this.availableTokensCountHandler.clearKey(identifier),
      this.internalMarketplaceRedisHandler.clearKey(collection),
    ]);
  }

  public async getOrSetAuctions(queryRequest: QueryRequest, getAuctions: () => any): Promise<[Auction[], number, PriceRange]> {
    return this.redisCacheService.getOrSet(this.getAuctionsCacheKey(queryRequest), () => getAuctions(), 5 * Constants.oneSecond());
  }

  public async getMinAndMax(token: string, getData: () => any): Promise<{ minBid: string; maxBid: string }> {
    return this.redisCacheService.getOrSet(generateCacheKeyFromParams('minMaxPrice', token), () => getData(), 5 * Constants.oneMinute());
  }

  public async getClaimableAuctions(limit: number = 10, offset: number = 0, key: string, getData: () => any): Promise<[Auction[], number]> {
    return this.redisCacheService.getOrSet(
      this.getClaimableAuctionsCacheKey(key, limit, offset),
      () => getData(),
      30 * Constants.oneSecond(),
    );
  }

  public async getCurrentPaymentTokens(
    getCurrentPaymentTokensFunction: () => any,
    marketplaceKey?: string,
    collectionIdentifier?: string,
  ): Promise<Token[]> {
    return this.redisCacheService.getOrSet(
      this.getCurrentPaymentTokensCacheKey(marketplaceKey, collectionIdentifier),
      () => getCurrentPaymentTokensFunction(),
      CacheInfo.CurrentPaymentTokens.ttl,
    );
  }

  private getAuctionsCacheKey(request: any) {
    return generateCacheKeyFromParams('auctions', hash(request));
  }

  private getClaimableAuctionsCacheKey(address: string, limit: number, offset: number) {
    return generateCacheKeyFromParams('claimable_auctions', address, limit, offset);
  }

  public getCurrentPaymentTokensCacheKey(marketplaceKey?: string, collectionIdentifier?: string) {
    return generateCacheKeyFromParams(CacheInfo.CurrentPaymentTokens.key, marketplaceKey, collectionIdentifier);
  }
}
