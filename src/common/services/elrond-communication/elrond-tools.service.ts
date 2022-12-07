import { Injectable, Logger } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import axios, { AxiosRequestConfig } from 'axios';
import { ApiConfigService } from 'src/utils/api.config.service';
import * as Agent from 'agentkeepalive';
import { PerformanceProfiler } from '@elrondnetwork/erdnest';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { NativeAuthSigner } from '@elrondnetwork/erdnest/lib/src/utils/native.auth.signer';
import BigNumber from 'bignumber.js';

@Injectable()
export class ElrondToolsService {
  private url: string;
  private config: AxiosRequestConfig;
  private nativeAuthSigner: NativeAuthSigner;

  constructor(
    private readonly logger: Logger,
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.url = process.env.ELROND_TOOLS;

    const keepAliveOptions = {
      maxSockets: elrondConfig.keepAliveMaxSockets,
      maxFreeSockets: elrondConfig.keepAliveMaxFreeSockets,
      timeout: this.apiConfigService.getKeepAliveTimeoutDownstream(),
      freeSocketTimeout: elrondConfig.keepAliveFreeSocketTimeout,
      keepAlive: true,
    };
    const httpAgent = new Agent(keepAliveOptions);
    const httpsAgent = new Agent.HttpsAgent(keepAliveOptions);

    this.config = {
      timeout: elrondConfig.proxyTimeout,
      httpAgent: elrondConfig.keepAlive ? httpAgent : null,
      httpsAgent: elrondConfig.keepAlive ? httpsAgent : null,
    };

    this.nativeAuthSigner = new NativeAuthSigner({
      host: 'nft-service',
      apiUrl: this.apiConfigService.getApiUrl(),
      privateKey: this.apiConfigService.getNativeAuthKey(),
    });
  }

  async getEgldHistoricalPrice(isoDateOnly: string): Promise<string> {
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
  ): Promise<string> {
    const priceInEgld = await this.getTokenPriceByTimestamp(
      token,
      elrondConfig.wegld,
      isoDateOnly,
    );
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
  ): Promise<string> {
    const query = this.getTokenPriceByTimestampQuery(
      firstToken,
      secondToken,
      isoDateOnly,
    );
    const res = await this.doPost(this.getTokenPriceByTimestamp.name, query);
    return res.data.trading.pair.price[0].last.toFixed(20);
  }

  private async getConfig(): Promise<AxiosRequestConfig> {
    const accessTokenInfo = await this.nativeAuthSigner.getToken();
    return {
      ...this.config,
      headers: {
        Authorization: `Bearer ${accessTokenInfo.token}`,
        authorization: `Bearer ${accessTokenInfo.token}`,
      },
    };
  }

  private async doPost(name: string, query: any): Promise<any> {
    const profiler = new PerformanceProfiler(name);
    try {
      const config = await this.getConfig();
      const response = await axios.post(this.url, { query }, config);
      return response.data;
    } catch (error) {
      this.logger.error(`Error when trying to get run ${name}`, {
        error: error.message,
        path: `${ElrondToolsService.name}.${this.doPost.name}`,
      });
    } finally {
      profiler.stop();
      MetricsCollector.setExternalCall(
        ElrondToolsService.name,
        profiler.duration,
      );
    }
  }
}
