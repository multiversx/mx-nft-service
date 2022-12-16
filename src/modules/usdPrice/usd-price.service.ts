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

  async getUsdAmountDenom(
    token: string,
    amount: string,
    timestamp?: number,
  ): Promise<string | undefined> {
    if (amount === '0') {
      return amount;
    }

    if (token === elrondConfig.egld || token === elrondConfig.wegld) {
      return computeUsdAmount(
        await this.getEgldPrice(timestamp),
        amount,
        elrondConfig.decimals,
      );
    }

    const tokenPriceUsd = await this.getEsdtPriceUsd(token, timestamp);
    if (!tokenPriceUsd) {
      return;
    }
    const tokenData = await this.getToken(token);
    return computeUsdAmount(tokenPriceUsd, amount, tokenData.decimals);
  }

  public async getAllCachedTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.AllTokens.key,
      async () => await this.setAllCachedTokens(),
      CacheInfo.AllTokens.ttl,
    );
  }

  public async getToken(tokenId: string): Promise<Token | null> {
    if (tokenId === elrondConfig.egld) {
      return new Token({
        identifier: elrondConfig.egld,
        symbol: elrondConfig.egld,
        name: elrondConfig.egld,
        decimals: elrondConfig.decimals,
        priceUsd: await this.getEgldPrice(),
      });
    }

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
    );
  }

  async getTokenPriceUsd(token: string): Promise<string | undefined> {
    if (token === elrondConfig.egld || token === elrondConfig.wegld) {
      return await this.getEgldPrice();
    }
    return await this.getEsdtPriceUsd(token);
  }

  private async getEsdtPriceUsd(
    tokenId: string,
    timestamp?: number,
  ): Promise<string | undefined> {
    if (!timestamp || DateUtils.isTimestampToday(timestamp)) {
      const dexTokens = await this.getCachedDexTokens();
      const token = dexTokens.find((token) => token.identifier === tokenId);
      return token?.priceUsd;
    }

    return await this.getTokenHistoricalPriceByEgld(tokenId, timestamp);
  }

  private async getTokenHistoricalPriceByEgld(
    token: string,
    timestamp: number,
  ): Promise<string | undefined> {
    const isoDateOnly = DateUtils.timestampToIsoStringWithoutTime(timestamp);
    const egldPriceUsd = await this.getEgldHistoricalPrice(timestamp);
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

  private async setAllCachedTokens(): Promise<Token[]> {
    let [apiTokens, dexTokens, egldPriceUSD] = await Promise.all([
      this.getCachedApiTokens(),
      this.getCachedDexTokens(),
      this.getEgldPrice(),
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

  private async getCachedDexTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.AllDexTokens.key,
      async () => await this.elrondApiService.getAllDexTokens(),
      CacheInfo.AllDexTokens.ttl,
    );
  }

  private async getCachedApiTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.AllApiTokens.key,
      async () => await this.elrondApiService.getAllTokens(),
      CacheInfo.AllApiTokens.ttl,
    );
  }

  private async getEgldPrice(timestamp?: number): Promise<string> {
    if (!timestamp || DateUtils.isTimestampToday(timestamp)) {
      return await this.getCurrentEgldPrice();
    }
    return await this.getEgldHistoricalPrice(timestamp);
  }

  private async getCurrentEgldPrice(): Promise<string> {
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.EgldToken.key,
      async () => await this.elrondApiService.getEgldPriceFromEconomics(),
      CacheInfo.EgldToken.ttl,
    );
  }

  private async getEgldHistoricalPrice(timestamp?: number): Promise<string> {
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

  private getTokenHistoricalPriceCacheKey(
    token: string,
    isoDateOnly: string,
  ): string {
    return generateCacheKeyFromParams(token, isoDateOnly);
  }
}
