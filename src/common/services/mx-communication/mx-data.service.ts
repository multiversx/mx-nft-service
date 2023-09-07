import { Injectable, Logger } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { ApiService } from './api.service';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';

@Injectable()
export class MxDataApiService {
  private url: string;

  constructor(
    private readonly logger: Logger,
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.url = this.apiConfigService.getPublicDataApi();
  }

  async getCexPrice(timestamp: string): Promise<number> {
    let requestUrl = `${this.url}/v1/quotes/cex/${mxConfig.egld}?fields=price&date=${timestamp}`;

    try {
      let response = await this.apiService.get(requestUrl, this.getHeaders());
      return response.data.price;
    } catch (error) {
      this.logger.error(`An error occurred while calling the mx data service on url ${requestUrl}`, {
        path: this.getCexPrice.name,
        exception: error,
      });
      return;
    }
  }

  async getCexTokens(): Promise<string[]> {
    const requestUrl = `${this.url}/v1/tokens/cex?fields=identifier`;
    try {
      let response = await this.apiService.get(requestUrl);

      return response?.data?.map((x) => x.identifier);
    } catch (error) {
      this.logger.error(`An error occurred while calling the mx data service on url ${requestUrl}`, {
        path: this.getCexTokens.name,
        exception: error,
      });
      return;
    }
  }

  async getXexchangeTokens(): Promise<string[]> {
    const requestUrl = `${this.url}/v1/tokens/xexchange?fields=identifier`;
    try {
      let response = await this.apiService.get(requestUrl);
      return response?.data?.map((x) => x.identifier);
    } catch (error) {
      this.logger.error(`An error occurred while calling the mx data service on url ${requestUrl}`, {
        path: this.getXexchangeTokens.name,
        exception: error,
      });
      return;
    }
  }

  async getXechangeTokenPrice(token: string, isoDateOnly: string): Promise<number> {
    const requestUrl = `${this.url}/v1/quotes/xexchange/${token}?date=${isoDateOnly}&fields=price`;
    try {
      let response = await this.apiService.get(requestUrl, this.getHeaders());

      return response.data.price;
    } catch (error) {
      this.logger.error(`An error occurred while calling the mx data service on url ${requestUrl}`, {
        path: this.getCexPrice.name,
        exception: error,
      });
      return;
    }
  }

  private getHeaders() {
    if (this.apiConfigService.getDataToolsApiKey())
      return {
        apiKey: this.apiConfigService.getDataToolsApiKey(),
      };
    return {};
  }
}
