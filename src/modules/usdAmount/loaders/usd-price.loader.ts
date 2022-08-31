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
export class UsdPriceLoader {
  private readonly persistentRedisClient: Redis.Redis;

  constructor(
    private cacheService: CachingService,
    private readonly elrondApiService: ElrondApiService,
  ) {
    this.persistentRedisClient = this.cacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getToken(tokenId: string): Promise<Token> {
    const allTokens: Token[] = await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.AllTokens.key,
      async () => await this.elrondApiService.getAllTokensWithDecimals(),
      CacheInfo.AllTokens.ttl,
      TimeConstants.oneMinute,
    );

    let token: Token;
    if (tokenId === elrondConfig.egld) {
      token = allTokens.find((t) => t.identifier === elrondConfig.wegld);
    } else {
      token = allTokens.find((t) => t.identifier === tokenId);
    }

    if (token) {
      const newToken: Token = JSON.parse(JSON.stringify(token));
      if (tokenId === elrondConfig.egld) {
        newToken.identifier = newToken.name = newToken.symbol = tokenId;
      }
      return newToken;
    }

    throw new Error(`Can't find token ${tokenId}`);
  }

  async getUsdAmount(tokenId: string, amount: string): Promise<string> {
    const token: Token = await this.getToken(tokenId);
    return computeUsdAmount(token.priceUsd, amount, token.decimals);
  }

  async getUsdAmountDenom(tokenId: string, amount: string): Promise<string> {
    const token: Token = await this.getToken(tokenId);
    const usdAmount = computeUsdAmount(token.priceUsd, amount, token.decimals);
    return denominate({
      input: usdAmount,
      denomination: 6,
      decimals: 3,
      showLastNonZeroDecimal: false,
    });
  }
}
