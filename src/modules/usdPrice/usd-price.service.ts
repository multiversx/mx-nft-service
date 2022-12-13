import { Injectable } from '@nestjs/common';
import { ElrondApiService, ElrondToolsService } from 'src/common';
import { CachingService } from 'src/common/services/caching/caching.service';
import { Token } from 'src/common/services/elrond-communication/models/Token.model';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { TimeConstants } from 'src/utils/time-utils';
import { cacheConfig, elrondConfig } from 'src/config';
import { computeUsdAmount } from 'src/utils/helpers';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { DateUtils } from 'src/utils/date-utils';

@Injectable()
export class UsdPriceService {
  private readonly persistentRedisClient: Redis.Redis;

  constructor(
    private cacheService: CachingService,
    private readonly elrondApiService: ElrondApiService,
    private readonly elrondToolsService: ElrondToolsService,
  ) {
    this.persistentRedisClient = this.cacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  public async getCachedTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.AllTokens.key,
      async () => await this.elrondApiService.getAllTokens(),
      CacheInfo.AllTokens.ttl,
    );
  }

  private async getCachedTokenData(
    tokenId: string,
  ): Promise<Token | undefined> {
    const tokens = await this.getCachedTokens();
    const token = tokens.find((t) => t.identifier === tokenId);
    if (token) {
      return token;
    }
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      `token_${tokenId}`,
      async () => await this.elrondApiService.getTokenData(tokenId),
      CacheInfo.AllTokens.ttl,
    );
  }

  private async getEgldCachedTokenData() {
    const token = await this.getCachedTokenData(elrondConfig.wegld);
    return new Token({
      ...token,
      identifier: elrondConfig.egld,
      symbol: elrondConfig.egld,
      name: elrondConfig.egld,
    });
  }

  async getToken(tokenId: string): Promise<Token | null> {
    if (tokenId === elrondConfig.egld) {
      return await this.getEgldCachedTokenData();
    }
    return await this.getCachedTokenData(tokenId);
  }

  async getUsdAmountDenom(
    token: string,
    amount: string,
    timestamp: number = DateUtils.getTimestamp(),
  ): Promise<string> {
    if (token === elrondConfig.egld) {
      return computeUsdAmount(
        await this.getCachedEgldHistoricalPrice(timestamp),
        amount,
        elrondConfig.decimals,
      );
    }

    const tokenPriceUsd = await this.getCachedTokenHistoricalPriceByEgld(
      token,
      timestamp,
    );
    const tokenData = await this.getCachedTokenData(token);
    return computeUsdAmount(tokenPriceUsd, amount, tokenData.decimals);
  }

  private async getCachedEgldHistoricalPrice(
    timestamp: number,
  ): Promise<string> {
    const isoDateOnly = DateUtils.timestampToIsoStringWithoutTime(timestamp);
    const cacheKey = this.getTokenHistoricalPriceCacheKey(
      elrondConfig.wegld,
      isoDateOnly,
    );
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      cacheKey,
      async () =>
        await this.elrondToolsService.getEgldHistoricalPrice(isoDateOnly),
      DateUtils.isTimestampToday(timestamp)
        ? TimeConstants.oneDay
        : CacheInfo.TokenHistoricalPrice.ttl,
    );
  }

  private async getCachedTokenHistoricalPriceByEgld(
    token: string,
    timestamp: number,
  ): Promise<string> {
    const isoDateOnly = DateUtils.timestampToIsoStringWithoutTime(timestamp);
    const egldPriceUsd = await this.getCachedEgldHistoricalPrice(timestamp);
    const cacheKey = this.getTokenHistoricalPriceCacheKey(token, isoDateOnly);
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      cacheKey,
      async () =>
        await this.elrondToolsService.getTokenHistoricalPriceByEgld(
          token,
          isoDateOnly,
          egldPriceUsd,
        ),
      DateUtils.isTimestampToday(timestamp)
        ? TimeConstants.oneDay
        : CacheInfo.TokenHistoricalPrice.ttl,
    );
  }

  private getTokenHistoricalPriceCacheKey(
    token: string,
    isoDateOnly: string,
  ): string {
    return generateCacheKeyFromParams(token, isoDateOnly);
  }
}
