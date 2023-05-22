
import { Injectable, Logger } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { NativeAuthSigner } from '@multiversx/sdk-nestjs/lib/src/utils/native.auth.signer';
import BigNumber from 'bignumber.js';
import { ApiService } from './api.service';
import { ApiSettings } from './models/api-settings';
import { getFilePathFromDist } from 'src/utils/helpers';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';
import { json } from 'express';

@Injectable()
export class MxToolsService {
  private url: string;
  private nativeAuthSigner: NativeAuthSigner;

  constructor(
    private readonly logger: Logger,
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.url = this.apiConfigService.getDataUrl();
    this.nativeAuthSigner = new NativeAuthSigner({
      origin: 'NftService',
      apiUrl: this.apiConfigService.getApiUrl(),
      signerPrivateKeyPath: getFilePathFromDist(mxConfig.pemFileName),
    });
  }

  async getNftsStats(
  ): Promise<string | undefined> {
    return await this.getTokenPriceByTimestamp();
  }
  private getTokenPriceByTimestampQuery(): string {
    return `{
      nfts {
        count(query: { range: WEEK, resolution: INTERVAL_DAY }) {
          time
          max
        }
        count24h(query: { range: WEEK, resolution: INTERVAL_DAY }) {
          time
          max
        }
        active_nfts(query: { range: MONTH, resolution: INTERVAL_WEEK }) {
          time
          max
        }
      }
    }`;
  }

  private async getTokenPriceByTimestamp(
  ): Promise<string | undefined> {
    const query = this.getTokenPriceByTimestampQuery(

    );
    const res = await this.doPost(this.getTokenPriceByTimestamp.name, query);
    for (const key in res.data.nfts) {
      if (Object.prototype.hasOwnProperty.call(res.data.nfts, key)) {
        const element = res.data.nfts[key];
        console.log({ element })
      }
    }
    console.log(JSON.stringify(res), res)
    return res?.data?.trading?.pair?.price?.[0]?.last?.toFixed(20) ?? undefined;
  }

  private async getConfig(): Promise<ApiSettings> {
    const accessTokenInfo = await this.nativeAuthSigner.getToken();
    console.log(accessTokenInfo.token)
    return {
      authorization: `Bearer ${accessTokenInfo.token}`,
      timeout: 500,
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
        path: `${MxToolsService.name}.${this.doPost.name}`,
      });
    }
  }
}
