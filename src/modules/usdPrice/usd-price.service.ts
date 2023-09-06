import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { mxConfig } from 'src/config';
import { computeUsdAmount } from 'src/utils/helpers';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { Token } from './Token.model';
import { MxDataApiService } from 'src/common/services/mx-communication/mx-data.service';
import { DateUtils } from 'src/utils/date-utils';

@Injectable()
export class UsdPriceService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly mxApiService: MxApiService,
    private readonly mxDataApi: MxDataApiService,
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
    return await this.cacheService.getOrSet(CacheInfo.AllTokens.key, async () => await this.setAllCachedTokens(), CacheInfo.AllTokens.ttl);
  }

  public async getTokenPriceFromDate(token: string, timestamp: number): Promise<number> {
    return await this.cacheService.getOrSet(
      `${CacheInfo.TokenHistoricalPrice.key}_${token}_${DateUtils.timestampToIsoStringWithHour(timestamp)}`,
      async () => await this.getTokenHistoricalPrice(token, timestamp),
      CacheInfo.TokenHistoricalPrice.ttl,
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

    return await this.cacheService.getOrSet(
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
    let [apiTokens, egldPriceUSD] = await Promise.all([this.getCachedApiTokens(), this.getCurrentEgldPrice()]);

    const egldToken: Token = new Token({
      identifier: mxConfig.egld,
      symbol: mxConfig.egld,
      name: mxConfig.egld,
      decimals: mxConfig.decimals,
      priceUsd: egldPriceUSD,
    });
    return apiTokens.concat([egldToken]);
  }

  private async getTokenHistoricalPrice(tokenId: string, timestamp: number): Promise<number> {
    let [cexTokens, xExchangeTokens] = await Promise.all([this.getCexTokens(), this.getXexchangeTokens()]);

    if (cexTokens?.includes(tokenId)) {
      {
        return await this.mxDataApi.getCexPrice(DateUtils.timestampToIsoStringWithHour(timestamp));
      }
    } else if (xExchangeTokens.includes(tokenId)) {
      return await this.mxDataApi.getXechangeTokenPrice(tokenId, DateUtils.timestampToIsoStringWithHour(timestamp));
    }
  }

  private async getCachedDexTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.AllDexTokens.key,
      async () => await this.mxApiService.getAllDexTokens(),
      CacheInfo.AllDexTokens.ttl,
    );
  }

  private async getCachedApiTokens(): Promise<Token[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.AllApiTokens.key,
      async () => await this.mxApiService.getAllTokens(),
      CacheInfo.AllApiTokens.ttl,
    );
  }

  private async getCurrentEgldPrice(): Promise<string> {
    return await this.cacheService.getOrSet(
      CacheInfo.EgldToken.key,
      async () => await this.mxApiService.getEgldPriceFromEconomics(),
      CacheInfo.EgldToken.ttl,
    );
  }

  private async getCexTokens(): Promise<string[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.CexTokens.key,
      async () => await this.mxDataApi.getCexTokens(),
      CacheInfo.CexTokens.ttl,
    );
  }

  private async getXexchangeTokens(): Promise<string[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.xExchangeTokens.key,
      async () => await this.mxDataApi.getXexchangeTokens(),
      CacheInfo.xExchangeTokens.ttl,
    );
  }
}
