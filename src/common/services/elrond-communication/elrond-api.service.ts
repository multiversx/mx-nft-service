import { ApiProvider } from '@elrondnetwork/erdjs';
import { Inject, Injectable } from '@nestjs/common';
import { Nft } from './models/nft.dto';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { Logger } from 'winston';
import * as Agent from 'agentkeepalive';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { elrondConfig } from 'src/config';

@Injectable()
export class ElrondApiService {
  private apiProvider: ApiProvider;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const keepAliveOptions = {
      maxSockets: elrondConfig.keepAliveMaxSockets,
      maxFreeSockets: elrondConfig.keepAliveMaxFreeSockets,
      timeout: elrondConfig.keepAliveTimeout,
      freeSocketTimeout: elrondConfig.keepAliveFreeSocketTimeout,
    };
    const httpAgent = new Agent(keepAliveOptions);
    const httpsAgent = new Agent.HttpsAgent(keepAliveOptions);

    this.apiProvider = new ApiProvider(process.env.ELROND_API, {
      timeout: elrondConfig.proxyTimeout,
      httpAgent: elrondConfig.keepAlive ? httpAgent : null,
      httpsAgent: elrondConfig.keepAlive ? httpsAgent : null,
    });
  }

  getService(): ApiProvider {
    return this.apiProvider;
  }

  async doGetGeneric(
    name: string,
    resourceUrl: string,
    callback: (response: any) => any,
  ): Promise<any> {
    try {
      const profiler = new PerformanceProfiler(`${name} ${resourceUrl}`);
      console.log({ resourceUrl });

      const response = await this.getService().doGetGeneric(
        resourceUrl,
        callback,
      );
      profiler.stop();

      MetricsCollector.setExternalCall(
        ElrondApiService.name,
        name,
        profiler.duration,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond api service on url ${resourceUrl}`,
        {
          path: `ElrondApiService.${name}`,
          error,
        },
      );
    }
  }

  async getTokensForUser(address: string): Promise<Nft[]> {
    return await this.doGetGeneric(
      this.getTokensForUser.name,
      `accounts/${address}/tokens`,
      (response) => response,
    );
  }

  async getNftByIdentifierAndAddress(
    address: string,
    identifier: string,
  ): Promise<Nft> {
    return await this.doGetGeneric(
      this.getNftByIdentifierAndAddress.name,
      `accounts/${address}/nfts/${identifier}`,
      (response) => response,
    );
  }

  async getNftsByIdentifier(identifiers: string[]): Promise<Nft[]> {
    return await this.doGetGeneric(
      this.getNftsByIdentifier.name,
      `nfts/?identifiers=${identifiers}`,
      (response) => response,
    );
  }

  async getNftByIdentifier(identifier: string): Promise<Nft> {
    return await this.doGetGeneric(
      this.getNftByIdentifier.name,
      `nfts/${identifier}`,
      (response) => response,
    );
  }

  async getNftsForUser(address: string, query: string = ''): Promise<Nft[]> {
    return await this.doGetGeneric(
      this.getNftsForUser.name,
      `accounts/${address}/nfts${query}`,
      (response) => response,
    );
  }

  async getNftsForUserCount(
    address: string,
    query: string = '',
  ): Promise<number> {
    return await this.doGetGeneric(
      this.getNftsForUserCount.name,
      `accounts/${address}/nfts/count${query}`,
      (response) => response,
    );
  }

  async getAllNfts(query: string = ''): Promise<Nft[]> {
    return await this.doGetGeneric(
      this.getAllNfts.name,
      `nfts${query}`,
      (response) => response,
    );
  }

  async getNftsCount(query: string = ''): Promise<number> {
    return await this.doGetGeneric(
      this.getNftsCount.name,
      `nfts/count${query}`,
      (response) => response,
    );
  }
}
