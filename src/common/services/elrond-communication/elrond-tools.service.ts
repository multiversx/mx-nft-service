import { Injectable, Logger } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import { ApiConfigService } from 'src/utils/api.config.service';
import { NativeAuthSigner } from '@elrondnetwork/erdnest/lib/src/utils/native.auth.signer';
import BigNumber from 'bignumber.js';
import { ApiService } from './api.service';
import { ApiSettings } from './models/api-settings';
import { getFilePathFromDist } from 'src/utils/helpers';

@Injectable()
export class ElrondToolsService {
  private url: string;
  private nativeAuthSigner: NativeAuthSigner;

  constructor(
    private readonly logger: Logger,
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.url = this.apiConfigService.getToolsUrl();
    this.nativeAuthSigner = new NativeAuthSigner({
      host: 'NftService',
      apiUrl: this.apiConfigService.getApiUrl(),
      signerPrivateKeyPath: getFilePathFromDist(elrondConfig.pemFileName),
    });
  }

  async getEgldHistoricalPrice(
    isoDateOnly: string,
  ): Promise<string | undefined> {
    return await this.getTokenPriceByTimestamp(
      elrondConfig.wegld,
      elrondConfig.usdc,
      isoDateOnly,
    );
  }

  async getTokenHistoricalPriceByEgld(
    token: string,
    isoDateOnly: string,
    cachedEgldPriceUsd?: string,
  ): Promise<string | undefined> {
    console.log('token', token);
    const priceInEgld = await this.getTokenPriceByTimestamp(
      token,
      elrondConfig.wegld,
      isoDateOnly,
    );
    if (!priceInEgld) {
      return;
    }
    const egldPriceUsd =
      cachedEgldPriceUsd ?? (await this.getEgldHistoricalPrice(isoDateOnly));
    return new BigNumber(priceInEgld).multipliedBy(egldPriceUsd).toFixed();
  }

  private getTokenPriceByTimestampQuery(
    firstToken: string,
    secondToken: string,
    isoDateOnly: string,
  ): string {
    return `query tokenUsdPrice {
      trading {
        pair(first_token: "${firstToken}", second_token: "${secondToken}") {
          price(query: {  date: "${isoDateOnly}"}) {
            last
          }
        }
      }
    }`;
  }

  private async getTokenPriceByTimestamp(
    firstToken: string,
    secondToken: string,
    isoDateOnly: string,
  ): Promise<string | undefined> {
    const query = this.getTokenPriceByTimestampQuery(
      firstToken,
      secondToken,
      isoDateOnly,
    );
    const res = await this.doPost(this.getTokenPriceByTimestamp.name, query);
    return res?.data?.trading?.pair?.price?.[0]?.last?.toFixed(20) ?? undefined;
  }

  private async getConfig(): Promise<ApiSettings> {
    const accessTokenInfo = await this.nativeAuthSigner.getToken();
    return {
      authorization: `Bearer ${accessTokenInfo.token}`,
    };
  }

  private async doPost(name: string, query: any): Promise<any> {
    try {
      const config = await this.getConfig();
      const response = await this.apiService.post(this.url, { query }, config);
      return response.data;
    } catch (error) {
      this.logger.error(`Error when trying to get run ${name}`, {
        error: error.message,
        path: `${ElrondToolsService.name}.${this.doPost.name}`,
      });
    }
  }
}
