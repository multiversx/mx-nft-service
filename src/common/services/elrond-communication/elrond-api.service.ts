import { ApiProvider } from '@elrondnetwork/erdjs';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Nft } from './models/nft.dto';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { Logger } from 'winston';
import * as Agent from 'agentkeepalive';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { elrondConfig } from 'src/config';
import { CollectionApi } from './models/collection.dto';
import { OwnerApi } from './models/onwer.api';

@Injectable()
export class ElrondApiService {
  private apiProvider: ApiProvider;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const keepAliveOptions = {
      maxSockets: elrondConfig.keepAliveMaxSockets,
      maxFreeSockets: elrondConfig.keepAliveMaxFreeSockets,
      timeout: parseInt(process.env.KEEPALIVE_TIMEOUT_DOWNSTREAM),
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
      const response = await this.getService().doGetGeneric(
        resourceUrl,
        callback,
      );
      profiler.stop();

      MetricsCollector.setExternalCall(
        ElrondApiService.name,
        profiler.duration,
        name,
      );

      return response;
    } catch (error) {
      if (error.inner?.response?.status === HttpStatus.NOT_FOUND) {
        return;
      }
      let customError = {
        method: 'GET',
        resourceUrl,
        response: error.inner?.response?.data,
        status: error.inner?.response?.status,
        message: error.message,
        name: error.name,
      };
      this.logger.error(
        `An error occurred while calling the elrond api service on url ${resourceUrl}`,
        {
          path: `ElrondApiService.${name}`,
          error: customError,
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

  async getNftsByIdentifiers(
    identifiers: string[],
    offset: number = 0,
    query: string = '&withOwner=true&withSupply=true',
  ): Promise<Nft[]> {
    return await this.doGetGeneric(
      this.getNftsByIdentifiers.name,
      `nfts?identifiers=${identifiers}&limit=${identifiers.length}&offset=${offset}&hasUris=true${query}`,
      (response) => response,
    );
  }

  async getNftByIdentifier(identifier: string): Promise<Nft> {
    return await this.doGetGeneric(
      this.getNftByIdentifier.name,
      `nfts/${identifier}?withSupply=true`,
      (response) => response,
    );
  }

  async getOwnersForIdentifier(
    identifier: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<OwnerApi[]> {
    return await this.doGetGeneric(
      this.getNftByIdentifier.name,
      `nfts/${identifier}/owners?from=${offset}&size=${limit}`,
      (response) => response,
    );
  }

  async getOwnersForIdentifierCount(identifier: string): Promise<number> {
    return await this.doGetGeneric(
      this.getNftByIdentifier.name,
      `nfts/${identifier}/owners/count`,
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

  async getNftsCount(query: string = ''): Promise<any> {
    return await this.doGetGeneric(
      this.getNftsCount.name,
      `nfts/count${query}`,
      (response) => response,
    );
  }

  async getCollectionsForAddress(
    address: string = '',
    query: string = '',
  ): Promise<CollectionApi[]> {
    return await this.doGetGeneric(
      this.getCollectionsForAddress.name,
      `accounts/${address}/collections${query}`,
      (response) => response,
    );
  }

  async getCollectionForIdentifier(
    identifier: string = '',
  ): Promise<CollectionApi> {
    return await this.doGetGeneric(
      this.getCollectionForIdentifier.name,
      `collections/${identifier}`,
      (response) => response,
    );
  }

  async getCollectionForOwnerAndIdentifier(
    address: string,
    identifier: string,
  ): Promise<CollectionApi> {
    return await this.doGetGeneric(
      this.getCollectionForOwnerAndIdentifier.name,
      `accounts/${address}/collections/${identifier}`,
      (response) => response,
    );
  }

  async getCollectionsForAddressCount(
    address: string = '',
    query: string = '',
  ): Promise<number> {
    return await this.doGetGeneric(
      this.getCollectionsForAddressCount.name,
      `accounts/${address}/collections/count${query}`,
      (response) => response,
    );
  }

  async getCollections(query: string = ''): Promise<CollectionApi[]> {
    return await this.doGetGeneric(
      this.getCollections.name,
      `collections${query}`,
      (response) => response,
    );
  }

  async getCollectionsCount(query: string = ''): Promise<number> {
    return await this.doGetGeneric(
      this.getCollectionsCount.name,
      `collections/count${query}`,
      (response) => response,
    );
  }
}
