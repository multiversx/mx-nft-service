import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { Token } from 'src/common/services/mx-communication/models/Token.model';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { mxConfig } from 'src/config';
import { computeUsdAmount } from 'src/utils/helpers';
import { CachingService } from '@multiversx/sdk-nestjs';

@Injectable()
export class UsdPriceService {
  constructor(
    private readonly cacheService: CachingService,
    private readonly mxApiService: MxApiService,
  ) {}

  async getUsdAmountDenom(token: string, amount: string): Promise<string> {
    if (amount === '0') {
      return amount;
    }

    const tokenData = await this.getToken(token);
    if (!tokenData.priceUsd) {
      return;
    }
    return computeUsdAmount(tokenData.priceUsd, amount, tokenData.decimals);
  }

  public async getAllCachedTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSetCache(
      CacheInfo.AllTokens.key,
      async () => await this.setAllCachedTokens(),
      CacheInfo.AllTokens.ttl,
    );
  }

  public async getToken(tokenId: string): Promise<Token> {
    if (tokenId === mxConfig.egld || tokenId === mxConfig.wegld) {
      return new Token({
        identifier: mxConfig.egld,
        symbol: mxConfig.egld,
        name: mxConfig.egld,
        decimals: mxConfig.decimals,
        priceUsd: await this.getCurrentEgldPrice(),
      });
    }

    const tokens = await this.getAllCachedTokens();
    const token = tokens.find((token) => token.identifier === tokenId);
    if (token) {
      return token;
    }

    return await this.cacheService.getOrSetCache(
      `token_${tokenId}`,
      async () => await this.mxApiService.getTokenData(tokenId),
      CacheInfo.AllTokens.ttl,
    );
  }

  async getTokenPriceUsd(token: string): Promise<string | undefined> {
    if (token === mxConfig.egld || token === mxConfig.wegld) {
      return await this.getCurrentEgldPrice();
    }
    return await this.getEsdtPriceUsd(token);
  }

  private async getEsdtPriceUsd(tokenId: string): Promise<string | undefined> {
    const dexTokens = await this.getCachedDexTokens();
    const token = dexTokens.find((token) => token.identifier === tokenId);
    return token?.priceUsd;
  }

  private async setAllCachedTokens(): Promise<Token[]> {
    let [apiTokens, egldPriceUSD] = await Promise.all([
      this.getCachedApiTokens(),
      this.getCurrentEgldPrice(),
    ]);

    const egldToken: Token = new Token({
      identifier: mxConfig.egld,
      symbol: mxConfig.egld,
      name: mxConfig.egld,
      decimals: mxConfig.decimals,
      priceUsd: egldPriceUSD,
    });
    return apiTokens.concat([egldToken]);
  }

  private async getCachedDexTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSetCache(
      CacheInfo.AllDexTokens.key,
      async () => await this.mxApiService.getAllDexTokens(),
      CacheInfo.AllDexTokens.ttl,
    );
  }

  private async getCachedApiTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSetCache(
      CacheInfo.AllApiTokens.key,
      async () => await this.mxApiService.getAllTokens(),
      CacheInfo.AllApiTokens.ttl,
    );
  }

  private async getCurrentEgldPrice(): Promise<string> {
    return await this.cacheService.getOrSetCache(
      CacheInfo.EgldToken.key,
      async () => await this.mxApiService.getEgldPriceFromEconomics(),
      CacheInfo.EgldToken.ttl,
    );
  }
}
