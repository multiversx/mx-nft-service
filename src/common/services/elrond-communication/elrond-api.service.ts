import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Nft, NftTag } from './models/nft.dto';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { Logger } from 'winston';
import * as Agent from 'agentkeepalive';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { elrondConfig } from 'src/config';
import { CollectionApi } from './models/collection.dto';
import { OwnerApi } from './models/onwer.api';
import { ApiNetworkProvider } from '@elrondnetwork/erdjs-network-providers/out';
import { AssetsQuery } from 'src/modules/assets/assets-query';

@Injectable()
export class ElrondApiService {
  private apiProvider: ApiNetworkProvider;
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

    this.apiProvider = new ApiNetworkProvider(process.env.ELROND_API, {
      timeout: elrondConfig.proxyTimeout,
      httpAgent: elrondConfig.keepAlive ? httpAgent : null,
      httpsAgent: elrondConfig.keepAlive ? httpsAgent : null,
      headers: {
        origin: 'NftService',
      },
    });
  }

  getService(): ApiNetworkProvider {
    return this.apiProvider;
  }

  async doGetGeneric(name: string, resourceUrl: string): Promise<any> {
    try {
      const profiler = new PerformanceProfiler(`${name} ${resourceUrl}`);
      const response = await this.getService().doGetGeneric(resourceUrl);
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

  async getAddressUsername(address: string): Promise<{ username: string }> {
    return await this.doGetGeneric(
      this.getAddressUsername.name,
      `accounts/${address}?fields=username`,
    );
  }

  async getTokensForUser(address: string): Promise<Nft[]> {
    return await this.doGetGeneric(
      this.getTokensForUser.name,
      `accounts/${address}/tokens`,
    );
  }

  async getNftByIdentifierAndAddress(
    address: string,
    identifier: string,
  ): Promise<Nft> {
    return await this.doGetGeneric(
      this.getNftByIdentifierAndAddress.name,
      `accounts/${address}/nfts/${identifier}`,
    );
  }

  async getNftsByIdentifiers(
    identifiers: string[],
    offset: number = 0,
    query: string = 'withOwner=true&withSupply=true',
  ): Promise<Nft[]> {
    query = `nfts${new AssetsQuery()
      .addIdentifiers(identifiers)
      .addPageSize(offset, identifiers.length)
      .addQuery(query)
      .build()}`;
    return await this.doGetGeneric(this.getNftsByIdentifiers.name, query);
  }

  async getNftByIdentifier(identifier: string): Promise<Nft> {
    return await this.doGetGeneric(
      this.getNftByIdentifier.name,
      `nfts/${identifier}`,
    );
  }

  async getNftByIdentifierForQuery(
    identifier: string,
    query: string,
  ): Promise<Nft> {
    const url = `nfts/${identifier}${new AssetsQuery(query).build()}`;
    return await this.doGetGeneric(this.getNftByIdentifier.name, url);
  }

  async getOwnersForIdentifier(
    identifier: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<OwnerApi[]> {
    return await this.doGetGeneric(
      this.getNftByIdentifier.name,
      `nfts/${identifier}/accounts?from=${offset}&size=${limit}`,
    );
  }

  async getOwnersForIdentifierCount(identifier: string): Promise<number> {
    return await this.doGetGeneric(
      this.getNftByIdentifier.name,
      `nfts/${identifier}/accounts/count`,
    );
  }

  async getNftsForUser(address: string, query: string = ''): Promise<Nft[]> {
    const url = `accounts/${address}/nfts${new AssetsQuery(query).build()}`;
    return await this.doGetGeneric(this.getNftsForUser.name, url);
  }

  async getNftsForUserCount(
    address: string,
    query: string = '',
  ): Promise<number> {
    const url = `accounts/${address}/nfts/count${new AssetsQuery(
      query,
    ).build()}`;
    return await this.doGetGeneric(this.getNftsForUserCount.name, url);
  }

  async getAllNfts(query: string = ''): Promise<Nft[]> {
    const url = `nfts${new AssetsQuery(query).build()}`;
    return await this.doGetGeneric(this.getAllNfts.name, url);
  }

  async getNftsCount(query: string = ''): Promise<any> {
    return await this.doGetGeneric(
      this.getNftsCount.name,
      `nfts/count${new AssetsQuery(query).build()}`,
    );
  }

  async getNftsCountForCollection(
    query: string = '',
    collection,
  ): Promise<{ value: string; key: string }> {
    const url = `nfts/count${new AssetsQuery(query).build()}`;
    const totalCount = await this.doGetGeneric(this.getNftsCount.name, url);
    return { key: collection, value: totalCount };
  }

  async getCollectionsByIdentifiers(
    identifiers: string[],
    offset: number = 0,
  ): Promise<CollectionApi[]> {
    return await this.doGetGeneric(
      this.getCollectionsByIdentifiers.name,
      `collections?identifiers=${identifiers}&size=${identifiers.length}&from=${offset}`,
    );
  }

  async getCollectionsForAddress(
    address: string = '',
    query: string = '',
  ): Promise<CollectionApi[]> {
    return await this.doGetGeneric(
      this.getCollectionsForAddress.name,
      `accounts/${address}/roles/collections${query}`,
    );
  }

  async getAllCollectionNftsForQuery(
    identifier: string = '',
    query: string = '',
  ): Promise<Nft[]> {
    const url = `collections/${identifier}/nfts${new AssetsQuery(
      query,
    ).build()}`;
    return await this.doGetGeneric(this.getAllCollectionNftsForQuery.name, url);
  }

  async getCollectionByIdentifierForQuery(
    identifier: string = '',
    query: string = '',
  ): Promise<CollectionApi> {
    return await this.doGetGeneric(
      this.getCollectionForIdentifier.name,
      `collections/${identifier}?${query}`,
    );
  }

  async getCollectionForIdentifier(
    identifier: string = '',
  ): Promise<CollectionApi> {
    return await this.doGetGeneric(
      this.getCollectionForIdentifier.name,
      `collections/${identifier}`,
    );
  }

  async getCollectionForOwnerAndIdentifier(
    address: string,
    identifier: string,
  ): Promise<CollectionApi> {
    return await this.doGetGeneric(
      this.getCollectionForOwnerAndIdentifier.name,
      `accounts/${address}/collections/${identifier}`,
    );
  }

  async getCollectionsForAddressCount(
    address: string = '',
    query: string = '',
  ): Promise<number> {
    return await this.doGetGeneric(
      this.getCollectionsForAddressCount.name,
      `accounts/${address}/roles/collections/count${query}`,
    );
  }

  async getCollections(query: string = ''): Promise<CollectionApi[]> {
    return await this.doGetGeneric(
      this.getCollections.name,
      `collections${query}`,
    );
  }

  async getCollectionsBySearch(
    searchTerm: string = '',
    size: number = 5,
  ): Promise<CollectionApi[]> {
    const requestedFields = 'collection,name';
    return await this.doGetGeneric(
      this.getCollections.name,
      `collections?search=${encodeURIComponent(
        searchTerm,
      )}&size=${size}&fields=${requestedFields}`,
    );
  }

  async getNftsBySearch(
    searchTerm: string = '',
    size: number = 5,
    fields: string = 'identifier,name',
  ): Promise<Nft[]> {
    const url = `nfts${new AssetsQuery()
      .addSearchTerm(searchTerm)
      .addPageSize(0, size)
      .addQuery(`&fields=${fields}`)
      .build()}`;
    return await this.doGetGeneric(this.getNftsBySearch.name, url);
  }

  async getTagsBySearch(searchTerm: string = ''): Promise<NftTag[]> {
    return await this.doGetGeneric(
      this.getTagsBySearch.name,
      `tags?search=${encodeURIComponent(searchTerm)}&size=5&fields=tag`,
    );
  }

  async getTags(
    from: number = 0,
    size: number = 10,
    searchTerm: string = '',
  ): Promise<NftTag[]> {
    const query =
      searchTerm !== '' ? `?search=${encodeURIComponent(searchTerm)}&` : '?';
    return await this.doGetGeneric(
      this.getTags.name,
      `tags${query}from=${from}&size=${size}`,
    );
  }

  async getTagsCount(searchTerm: string = ''): Promise<number> {
    const query =
      searchTerm !== '' ? `?search=${encodeURIComponent(searchTerm)}` : '';
    return await this.doGetGeneric(
      this.getTagsCount.name,
      `tags/count${query}`,
    );
  }

  async getCollectionsCount(query: string = ''): Promise<number> {
    return await this.doGetGeneric(
      this.getCollectionsCount.name,
      `collections/count${query}`,
    );
  }
}
