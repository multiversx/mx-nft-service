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

  public async getAllCachedTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.AllTokens.key,
      async () => await this.setAllCachedTokens(),
      CacheInfo.AllTokens.ttl,
    );
  }

  public async getCachedTokenData(tokenId: string): Promise<Token> {
    const tokens = await this.getAllCachedTokens();
    const token = tokens.find((token) => token.identifier === tokenId);
    if (token) {
      return token;
    }

    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      `token_${tokenId}`,
      async () => await this.elrondApiService.getTokenData(tokenId),
      CacheInfo.AllTokens.ttl,
      TimeConstants.oneMinute,
    );
  }

  async getTokenCurrentPrice(tokenId: string): Promise<string> {
    if (tokenId === elrondConfig.egld || tokenId === elrondConfig.wegld) {
      return await this.getCachedEgldHistoricalPrice();
    }

    const dexTokens = await this.getDexCachedTokens();
    const token = dexTokens.find((token) => token.identifier === tokenId);
    return (
      token.priceUsd ??
      (await this.getCachedTokenHistoricalPriceByEgld(tokenId))
    );
  }

  async getToken(tokenId: string): Promise<Token | null> {
    return await this.getCachedTokenData(tokenId);
  }

  async getUsdAmountDenom(
    token: string,
    amount: string,
    timestamp: number = DateUtils.getTimestamp(),
  ): Promise<string> {
    if (token === elrondConfig.egld || token === elrondConfig.wegld) {
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

  private async setAllCachedTokens(): Promise<Token[]> {
    let [apiTokens, dexTokens, egldPriceUSD] = await Promise.all([
      this.elrondApiService.getAllTokens(),
      this.getDexCachedTokens(),
      this.getCachedEgldHistoricalPrice(),
    ]);
    dexTokens.map((dexToken) => {
      apiTokens.find(
        (apiToken) => apiToken.identifier === dexToken.identifier,
      ).priceUsd = dexToken.priceUsd;
    });
    const egldToken: Token = new Token({
      identifier: elrondConfig.egld,
      symbol: elrondConfig.egld,
      name: elrondConfig.egld,
      decimals: elrondConfig.decimals,
      priceUsd: egldPriceUSD,
    });
    return apiTokens.concat([egldToken]);
  }

  private async getDexCachedTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.AllDexTokens.key,
      async () => await this.elrondApiService.getAllDexTokens(),
      CacheInfo.AllDexTokens.ttl,
    );
  }

  private async getCachedEgldHistoricalPrice(
    timestamp?: number,
  ): Promise<string> {
    if (!timestamp || DateUtils.isTimestampToday(timestamp)) {
      return await this.cacheService.getOrSetCache(
        this.persistentRedisClient,
        CacheInfo.EgldToken.key,
        async () => await this.elrondApiService.getEgldPriceFromEconomics(),
        CacheInfo.EgldToken.ttl,
      );
    }

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
    timestamp: number = DateUtils.getCurrentTimestamp(),
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
