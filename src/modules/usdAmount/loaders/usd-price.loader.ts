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

  private async getToken(tokenId: string): Promise<Token> {
    const allTokens: Token[] = await this.cacheService.getOrSetCache(
      this.persistentRedisClient,
      CacheInfo.AllTokens.key,
      async () => await this.elrondApiService.getAllTokensWithDecimals(),
      30 * TimeConstants.oneMinute,
    );

    let token: Token;
    if (tokenId === elrondConfig.egld) {
      token = allTokens.find((t) => t.id === elrondConfig.wegld);
    } else {
      token = allTokens.find((t) => t.id === tokenId);
    }

    return token;
  }

  async getUsdAmount(tokenId: string, amount: string): Promise<string> {
    const token: Token = await this.getToken(tokenId);
    return computeUsdAmount(token.price, amount, token.decimals);
  }

  async getUsdAmountDenom(tokenId: string, amount: string): Promise<string> {
    const token: Token = await this.getToken(tokenId);
    const tokenPriceUsd = computeUsdAmount(token.price, amount, token.decimals);
    return denominate({
      input: tokenPriceUsd,
      denomination: 6,
      decimals: 3,
      showLastNonZeroDecimal: false,
    });
  }
}
