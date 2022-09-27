import { Injectable } from '@nestjs/common';
import '../../../utils/extentions';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { RedisCacheService } from 'src/common';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';
import { PriceRange } from 'src/db/auctions/price-range';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { AuctionWithBidsCount } from 'src/db/auctions/auctionWithBidCount.dto';
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
import { UsdPriceService } from 'src/modules/usdAmount/usd-price.service';
import { Token } from 'src/common/services/elrond-communication/models/Token.model';

@Injectable()
export class AuctionsCachingService {
  private redisClient: Redis.Redis;
  constructor(
    private auctionsLoader: AuctionsForAssetRedisHandler,
    private lowestAuctionLoader: LowestAuctionRedisHandler,
    private assetsAuctionsCountLoader: AssetAuctionsCountRedisHandler,
    private UsdPriceService: UsdPriceService,
    private onSaleAssetsCount: OnSaleAssetsCountForCollectionRedisHandler,
    private availableTokensCountHandler: AssetAvailableTokensCountRedisHandler,
    private accountStatsCachingService: AccountsStatsCachingService,
    private internalMarketplaceRedisHandler: InternalMarketplaceRedisHandler,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.auctionsRedisClientName,
    );
  }

  public async invalidateCache(): Promise<void> {
    return await this.redisCacheService.flushDb(this.redisClient);
  }

  public async invalidatePersistentCaching(
    identifier: string,
    address: string,
  ) {
    const { collection } = getCollectionAndNonceFromIdentifier(identifier);
    return await Promise.all([
      this.accountStatsCachingService.invalidateStats(address),
      this.auctionsLoader.clearKey(identifier),
      this.lowestAuctionLoader.clearKey(identifier),
      this.assetsAuctionsCountLoader.clearKey(identifier),
      this.onSaleAssetsCount.clearKey(collection),
      this.availableTokensCountHandler.clearKey(identifier),
      this.internalMarketplaceRedisHandler.clearKey(collection),
    ]);
  }

  public async invalidateCacheByPattern(address: string) {
    await this.redisCacheService.delByPattern(
      this.redisClient,
      generateCacheKeyFromParams('claimable_auctions', address),
    );
  }

  public async getOrSetAuctions(
    queryRequest: QueryRequest,
    getAuctions: () => any,
  ): Promise<[Auction[], number, PriceRange]> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getAuctionsCacheKey(queryRequest),
      () => getAuctions(),
      30 * TimeConstants.oneSecond,
    );
  }

  public async getAuctionsOrderByNoBids(
    queryRequest,
    getAuctions: () => any,
  ): Promise<[Auction[], number, PriceRange]> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      CacheInfo.TopAuctionsOrderByNoBids.key,
      () => getAuctions(),
      TimeConstants.oneHour,
    );
  }

  public async getAuctionsEndingInAMonth(
    getAuctions: () => any,
  ): Promise<[AuctionWithBidsCount[], number, PriceRange]> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      CacheInfo.AuctionsEndingInAMonth.key,
      () => getAuctions(),
      TimeConstants.oneHour,
    );
  }

  public async getMinAndMax(
    token: string,
    getData: () => any,
  ): Promise<{ minBid: string; maxBid: string }> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      generateCacheKeyFromParams('minMaxPrice', token),
      () => getData(),
      5 * TimeConstants.oneMinute,
    );
  }

  public async getClaimableAuctions(
    limit: number = 10,
    offset: number = 0,
    key: string,
    getData: () => any,
  ): Promise<[Auction[], number]> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getClaimableAuctionsCacheKey(key, limit, offset),
      () => getData(),
      30 * TimeConstants.oneSecond,
    );
  }

  public async getCurrentAuctionsPaymentTokens(
    marketplaceKey: string = undefined,
    getData: () => any,
  ): Promise<Token[]> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getCurrentAuctionsTokensCacheKey(marketplaceKey),
      () => getData(),
      CacheInfo.CurrentAuctionsTokens.ttl,
    );
  }

  private getAuctionsCacheKey(request: any) {
    return generateCacheKeyFromParams('auctions', hash(request));
  }

  private getClaimableAuctionsCacheKey(
    address: string,
    limit: number,
    offset: number,
  ) {
    return generateCacheKeyFromParams(
      'claimable_auctions',
      address,
      limit,
      offset,
    );
  }

  public getCurrentAuctionsTokensCacheKey(marketplaceKey: string = undefined) {
    return generateCacheKeyFromParams(
      CacheInfo.CurrentAuctionsTokens.key,
      marketplaceKey,
    );
  }
}
