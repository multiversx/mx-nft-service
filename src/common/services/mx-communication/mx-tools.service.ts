import { Injectable, Logger } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { NativeAuthSigner } from '@multiversx/sdk-nestjs-http';
import { ApiService } from './api.service';
import { ApiSettings } from './models/api-settings';
import { getFilePathFromDist } from 'src/utils/helpers';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';
import { AnalyticsInput } from 'src/modules/analytics/models/analytics-input.model';
import { AnalyticsAggregateValue } from 'src/modules/analytics/models/analytics-aggregate-value';
import * as moment from 'moment';

@Injectable()
export class MxToolsService {
  private url: string;
  private nativeAuthSigner: NativeAuthSigner;

  constructor(
    private readonly logger: Logger,
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.url = this.apiConfigService.getToolsUrl();
    this.nativeAuthSigner = new NativeAuthSigner({
      origin: 'NftService',
      apiUrl: this.apiConfigService.getApiUrl(),
      signerPrivateKeyPath: getFilePathFromDist(mxConfig.pemFileName),
    });
  }

  async getNftsCount(input: AnalyticsInput): Promise<AnalyticsAggregateValue[]> {
    try {
      const query = this.getNftsCountQuery(input);
      const res = await this.doPost(this.getActiveNftsStats.name, query);
      return res.data?.nfts?.count.map((x) => AnalyticsAggregateValue.fromDataApi(x));
    } catch (error) {
      this.logger.error(`An error occurred while mapping data api response`, {
        path: this.getNftsCount.name,
        input,
        exception: error,
      });
      return;
    }
  }

  async getActiveNftsStats(input: AnalyticsInput): Promise<AnalyticsAggregateValue[]> {
    try {
      const query = this.getLatestListingNumber(input);
      const res = await this.doPost(this.getActiveNftsStats.name, query);
      return res.data?.nfts?.active_nfts.map((x) => AnalyticsAggregateValue.fromDataApi(x));
    } catch (error) {
      this.logger.error(`An error occurred while mapping data api response`, {
        path: this.getActiveNftsStats.name,
        input,
        exception: error,
      });
      return;
    }
  }

  async getLast24HActive(input: AnalyticsInput): Promise<AnalyticsAggregateValue[]> {
    try {
      const query = this.getNftsCountLast24h(input);
      const res = await this.doPost(this.getActiveNftsStats.name, query);
      return res.data?.nfts?.count24h.map((x) => AnalyticsAggregateValue.fromDataApi(x));
    } catch (error) {
      this.logger.error(`An error occurred while mapping data api response`, {
        path: this.getLast24HActive.name,
        input,
        exception: error,
      });
      return;
    }
  }

  async getNftTransactionsCount(identifier: string, input: AnalyticsInput): Promise<AnalyticsAggregateValue[]> {
    try {
      const query = this.getNftsTransfersCountQuery(identifier, input);
      const res = await this.doPost(this.getNftTransactionsCount.name, query);
      return res.data?.nfts?.transfers?.map(
        (x) =>
          new AnalyticsAggregateValue({
            series: x.series,
            time: moment.utc(x?.timestamp ?? x?.time).format('yyyy-MM-DD HH:mm:ss'),
            value: x.last ?? 0,
          }),
      );
    } catch (error) {
      this.logger.error(`An error occurred while mapping data api response`, {
        path: this.getNftTransactionsCount.name,
        input,
        exception: error,
      });
      return;
    }
  }

  private getNftsCountQuery(input: AnalyticsInput): string {
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
      }
    }`;
  }

  private getNftsTransfersCountQuery(identifier: string, input: AnalyticsInput): string {
    return `{
      nfts {
        transfers(identifier: "${identifier}", query: { range: ${input.range}, resolution:  ${input.resolution}, fill_data_gaps_skip_null_values: true }) {
          time
          avg
          count
          max
          min
          sum
          last
        }
      }
    }`;
  }

  private getNftsCountLast24h(input: AnalyticsInput): string {
    return `{
      nfts {
        count24h(query: { range: ${input.range}, resolution:  ${input.resolution} }) {
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

  private getLatestListingNumber(input: AnalyticsInput): string {
    return `{
      nfts {
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
