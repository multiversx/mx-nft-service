
import { Injectable, Logger } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { NativeAuthSigner } from '@multiversx/sdk-nestjs/lib/src/utils/native.auth.signer';
import { ApiService } from './api.service';
import { ApiSettings } from './models/api-settings';
import { getFilePathFromDist } from 'src/utils/helpers';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';
import { GeneralAnalyticsModel } from 'src/modules/analytics/models/general-stats.model';
import { AggregateValue } from 'src/modules/analytics/models/aggregate-value';
import { AnalyticsInput } from 'src/modules/analytics/models/AnalyticsInput';

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

  async getNftsStats(input: AnalyticsInput
  ): Promise<GeneralAnalyticsModel> {
    try {
      const query = this.getTokenPriceByTimestampQuery(input);
      let response = new GeneralAnalyticsModel()
      const res = await this.doPost(this.getNftsStats.name, query);
      for (const key in res.data.nfts) {
        if (Object.prototype.hasOwnProperty.call(res.data.nfts, key)) {
          const elem = res.data.nfts[key]
          switch (key) {
            case 'count':
              response.nfts = elem.map(x => AggregateValue.fromDataApi(x))
              break;
            case 'active_nfts':
              response.listing = elem.map(x => AggregateValue.fromDataApi(x))
              break;
            case 'count24h':
              response.volume = elem.map(x => AggregateValue.fromDataApi(x))
              break;

          }
        }
      }
      return response;
    } catch (error) {
      this.logger.error(
        `An error occurred while mapping data api response`,
        {
          path: this.getNftsStats.name,
          input,
          exception: error,
        },
      );
      return;
    }

  }

  private getTokenPriceByTimestampQuery(input: AnalyticsInput): string {
    return `{
      nfts {
        count(query: { range: ${input.range}, resolution:  ${input.resolution} }) {
          time
          avg
          count
          max
          min
          sum
        }
        count24h(query: { range: ${input.range}, resolution:  ${input.resolution} }) {
          time
          avg
          count
          max
          min
          sum
        }
        active_nfts(query: { range: ${input.range}, resolution:  ${input.resolution}}) {
          time
          avg
          count
          max
          min
          sum
        }
      }
    }`;
  }

  private async getConfig(): Promise<ApiSettings> {
    const accessTokenInfo = await this.nativeAuthSigner.getToken();
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
