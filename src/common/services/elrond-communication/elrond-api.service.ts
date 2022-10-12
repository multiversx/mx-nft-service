import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Nft, NftMetadata, NftTag } from './models/nft.dto';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { Logger } from 'winston';
import * as Agent from 'agentkeepalive';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { constants, elrondConfig } from 'src/config';
import { CollectionApi } from './models/collection.dto';
import { OwnerApi } from './models/onwer.api';
import {
  ApiNetworkProvider,
  TransactionOnNetwork,
} from '@elrondnetwork/erdjs-network-providers/out';
import { AssetsQuery } from 'src/modules/assets/assets-query';
import { Token } from './models/Token.model';
import { BatchUtils } from '@elrondnetwork/erdnest';
import { Address } from '@elrondnetwork/erdjs/out';
import { SmartContractApi } from './models/smart-contract.api';
import { XOXNO_MINTING_MANAGER } from 'src/utils/constants';

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

  async doPostGeneric(
    name: string,
    resourceUrl: string,
    payload: any,
  ): Promise<any> {
    try {
      const profiler = new PerformanceProfiler(`${name} ${resourceUrl}`);
      const response = await this.getService().doPostGeneric(
        resourceUrl,
        payload,
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
        method: 'POST',
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

  async getAccountSmartContracts(
    address: string,
    size: number,
  ): Promise<SmartContractApi[]> {
    return await this.doGetGeneric(
      this.getAccountSmartContracts.name,
      `accounts/${address}/contracts?size=${size}`,
    );
  }

  async getAccountSmartContractsCount(address: string): Promise<number> {
    return await this.doGetGeneric(
      this.getAccountSmartContracts.name,
      `accounts/${address}/contracts/count`,
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
      .build(false)}`;
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
    query: string = 'withOwner=true&withSupply=true',
  ): Promise<Nft> {
    const url = `nfts/${identifier}${new AssetsQuery(query).build()}`;
    return await this.doGetGeneric(this.getNftByIdentifier.name, url);
  }

  async getNftMetadataByIdentifierForQuery(
    identifier: string,
    query: string = 'extract=metadata&withOwner=true&withSupply=true',
  ): Promise<NftMetadata> {
    const url = `nfts/${identifier}${new AssetsQuery(query).build()}`;
    return await this.doGetGeneric(
      this.getNftMetadataByIdentifierForQuery.name,
      url,
    );
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
    const url = `nfts${new AssetsQuery(query).withNsfwFlag().build()}`;
    return await this.doGetGeneric(this.getAllNfts.name, url);
  }

  async getNftsCount(query: string = ''): Promise<number> {
    const url = `nfts/count${new AssetsQuery(query).withNsfwFlag().build()}`;
    return await this.doGetGeneric(this.getNftsCount.name, url);
  }

  async getNftsAndCount(
    nftsQuery: string = '',
    nftsCountQuery = '',
  ): Promise<[Nft[], number]> {
    return [
      await this.getAllNfts(nftsQuery),
      await this.getNftsCount(nftsCountQuery),
    ];
  }

  async getNftsAndCountForAccount(
    ownerAddress: string,
    nftsQuery: string = '',
    nftsCountQuery = '',
  ): Promise<[Nft[], number]> {
    return [
      await this.getNftsForUser(ownerAddress, nftsQuery),
      await this.getNftsForUserCount(ownerAddress, nftsCountQuery),
    ];
  }

  async getNftsCountForCollection(
    query: string = '',
    collection,
  ): Promise<{ value: string; key: string }> {
    const url = `nfts/count${new AssetsQuery(query).withNsfwFlag().build()}`;
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

  async getCollectionsForAddressWithRoles(
    address: string = '',
    query: string = '',
  ): Promise<CollectionApi[]> {
    return await this.doGetGeneric(
      this.getCollectionsForAddressWithRoles.name,
      `accounts/${address}/roles/collections${query}`,
    );
  }

  async getCollectionsForAddressWithNfts(
    address: string = '',
    query: string = '',
  ): Promise<CollectionApi[]> {
    return await this.doGetGeneric(
      this.getCollectionsForAddressWithNfts.name,
      `accounts/${address}/collections${query}`,
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
      `accounts/${address}/roles/collections/${identifier}`,
    );
  }

  async getCollectionsForAddressWithNftsCount(
    address: string = '',
    query: string = '',
  ): Promise<number> {
    return await this.doGetGeneric(
      this.getCollectionsForAddressWithNftsCount.name,
      `accounts/${address}/collections/count${query}`,
    );
  }

  async getCollectionsForAddressWithRolesCount(
    address: string = '',
    query: string = '',
  ): Promise<number> {
    return await this.doGetGeneric(
      this.getCollectionsForAddressWithRolesCount.name,
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
    const requestedFields = 'collection,name,assets';
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

  async getAllNftsByCollectionAfterNonce(
    collection: string,
    fields: string = 'identifier,nonce,timestamp',
    startNonce?: number,
    endNonce?: number,
  ): Promise<Nft[]> {
    const batchSize = constants.getNftsFromApiBatchSize;

    let nfts: Nft[] = [];
    let batch: Nft[] = [];

    let lastEnd = startNonce ?? 0;

    do {
      const start = lastEnd + 1;
      let end;

      if (startNonce !== undefined && endNonce !== undefined) {
        end = Math.min(endNonce, start + batchSize - 1);
      } else {
        end = start + batchSize - 1;
      }

      let query = new AssetsQuery()
        .addNonceAfter(start)
        .addNonceBefore(end)
        .addPageSize(0, batchSize)
        .addQuery(`&fields=${fields}`);

      const url = `collections/${collection}/nfts${query.build()}`;

      batch = await this.doGetGeneric(
        this.getAllNftsByCollectionAfterNonce.name,
        url,
      );

      nfts = nfts.concat(batch);
      lastEnd = end;
    } while (lastEnd < endNonce);

    return this.filterUniqueNftsByNonce(nfts);
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

  async getAllMexTokens(): Promise<Token[]> {
    const allTokens = await this.doGetGeneric(
      this.getAllMexTokens.name,
      'mex/tokens?size=10000',
    );
    return allTokens.map((t) => Token.fromElrondApiToken(t));
  }

  async getAllMexTokensWithDecimals(): Promise<Token[]> {
    const batchSize = constants.getTokensFromApiBatchSize;
    const tokens: Token[] = await this.getAllMexTokens();

    const tokenChunks = BatchUtils.splitArrayIntoChunks(tokens, batchSize);
    for (const tokenChunk of tokenChunks) {
      const identifiersParam = tokenChunk.map((t) => t.identifier).join(',');
      const tokensWithDecimals = await this.doGetGeneric(
        this.getAllMexTokensWithDecimals.name,
        `tokens?identifiers=${identifiersParam}&fields=identifier,decimals&size=${tokenChunk.length}`,
      );

      if (!tokensWithDecimals) {
        continue;
      }

      for (const tokenWithDecimals of tokensWithDecimals) {
        const token = tokens.find(
          (t) => t.identifier === tokenWithDecimals.identifier,
        );
        if (token) {
          token.decimals = tokenWithDecimals.decimals;
        }
      }
    }

    return tokens;
  }

  async getEgldPriceFromEconomics(): Promise<string> {
    return await this.doGetGeneric(
      this.getEgldPriceFromEconomics.name,
      'economics?extract=price',
    );
  }

  async getTokenData(tokenId: string): Promise<Token | undefined> {
    const token = await this.doGetGeneric(
      this.getTokenData.name,
      `tokens/${tokenId}?fields=identifier,name,ticker,decimals`,
    );
    return token
      ? new Token({
          ...token,
          symbol: token.ticker,
        })
      : undefined;
  }

  async getSmartContractOwner(
    address: string,
  ): Promise<{ address: string; owner: string }> {
    let scAddress = new Address(address);
    while (
      scAddress.isContractAddress() &&
      scAddress.bech32() !== XOXNO_MINTING_MANAGER
    ) {
      const { ownerAddress } = await this.doGetGeneric(
        this.getSmartContractOwner.name,
        `accounts/${scAddress.bech32()}?fields=ownerAddress`,
      );
      scAddress = new Address(ownerAddress);
    }
    return { address, owner: scAddress.bech32() };
  }

  async getTransactionByHash(txHash: string): Promise<TransactionOnNetwork> {
    return await this.apiProvider.getTransaction(txHash);
  }

  async getCollectionNftsCount(ticker: string): Promise<number> {
    return await this.doGetGeneric(
      this.getCollectionsCount.name,
      `collections/${ticker}/nfts/count`,
    );
  }

  private filterUniqueNftsByNonce(nfts: Nft[]): Nft[] {
    return nfts.distinct((nft) => nft.nonce);
  }
}
