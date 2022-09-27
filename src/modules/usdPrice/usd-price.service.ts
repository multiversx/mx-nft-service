import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { CachingService } from 'src/common/services/caching/caching.service';
import { Token } from 'src/common/services/elrond-communication/models/Token.model';
import * as Redis from 'ioredis';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { TimeConstants } from 'src/utils/time-utils';
import { cacheConfig, elrondConfig } from 'src/config';
import denominate from 'src/utils/formatters';
import { computeUsdAmount } from 'src/utils/helpers';

@Injectable()
export class UsdPriceService {
  private readonly persistentRedisClient: Redis.Redis;

  constructor(
    private cacheService: CachingService,
    private readonly elrondApiService: ElrondApiService,
  ) {
    this.persistentRedisClient = this.cacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  public async getCachedMexTokensWithDecimals(): Promise<Token[]> {
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.AllTokens.key,
      async () => await this.elrondApiService.getAllMexTokensWithDecimals(),
      CacheInfo.AllTokens.ttl,
      TimeConstants.oneMinute,
    );
  }

  private async getCachedTokenData(
    tokenId: string,
  ): Promise<Token | undefined> {
    const mexTokens = await this.getCachedMexTokensWithDecimals();
    const token = mexTokens.find((t) => t.identifier === tokenId);
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

  private async getCachedEgldPrice(): Promise<string> {
    return await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.EgldToken.key,
      async () => await this.elrondApiService.getEgldPriceFromEconomics(),
      CacheInfo.EgldToken.ttl,
      TimeConstants.oneMinute,
    );
  }

  async getToken(tokenId: string): Promise<Token | null> {
    switch (tokenId) {
      case elrondConfig.egld: {
        const egldPriceUsd: string = await this.getCachedEgldPrice();
        return new Token({
          identifier: elrondConfig.egld,
          symbol: elrondConfig.egld,
          name: elrondConfig.egld,
          decimals: elrondConfig.decimals,
          priceUsd: egldPriceUsd,
        });
      }
      case elrondConfig.lkmex: {
        const mexToken = await this.getCachedTokenData(elrondConfig.mex);
        return new Token({
          identifier: tokenId,
          name: 'LockedMEX',
          symbol: 'LKMEX',
          decimals: elrondConfig.decimals,
          priceUsd: mexToken?.priceUsd ?? null,
        });
      }
      default: {
        let token: Token = await this.getCachedTokenData(tokenId);
        return token
          ? token
          : new Token({
              identifier: tokenId,
            });
      }
    }
  }

  async getUsdAmount(tokenId: string, amount: string): Promise<string> {
    const token: Token = await this.getToken(tokenId);
    return computeUsdAmount(token.priceUsd, amount, token.decimals);
  }

  async getUsdAmountDenom(
    tokenId: string,
    amount: string,
  ): Promise<string | null> {
    const token: Token = await this.getToken(tokenId);
    if (token && token.priceUsd && token.decimals) {
      const usdAmount = computeUsdAmount(
        token.priceUsd,
        amount,
        token.decimals,
      );
      if (tokenId === elrondConfig.egld) {
        return usdAmount;
      }
      return denominate({
        input: usdAmount,
        denomination: 6,
        decimals: 3,
        showLastNonZeroDecimal: false,
      });
    }
    return null;
  }
}
