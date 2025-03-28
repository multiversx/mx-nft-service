import { Address, ApiNetworkProvider, TransactionOnNetwork } from '@multiversx/sdk-core';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as Agent from 'agentkeepalive';
import { constants, mxConfig } from 'src/config';
import { AssetsQuery } from 'src/modules/assets/assets-query';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { CustomRank } from 'src/modules/nft-rarity/models/custom-rank.model';
import { XOXNO_MINTING_MANAGER } from 'src/utils/constants';
import { Token } from '../../../modules/usdPrice/Token.model';
import { CollectionApi } from './models/collection.dto';
import { MxApiAbout } from './models/mx-api-about.model';
import { MxStats } from './models/mx-stats.model';
import { Nft, NftMetadata, NftTag } from './models/nft.dto';
import { OwnerApi } from './models/owner.api';
import { SmartContractApi } from './models/smart-contract.api';

@Injectable()
export class MxApiService {
  private apiProvider: ApiNetworkProvider;

  constructor(private readonly logger: Logger) {
    const keepAliveOptions = {
      maxSockets: mxConfig.keepAliveMaxSockets,
      maxFreeSockets: mxConfig.keepAliveMaxFreeSockets,
      timeout: parseInt(process.env.KEEPALIVE_TIMEOUT_DOWNSTREAM),
      freeSocketTimeout: mxConfig.keepAliveFreeSocketTimeout,
    };
    const httpAgent = new Agent(keepAliveOptions);
    const httpsAgent = new Agent.HttpsAgent(keepAliveOptions);
    this.apiProvider = new ApiNetworkProvider(process.env.ELROND_API, {
      timeout: mxConfig.proxyTimeout,
      httpAgent: mxConfig.keepAlive ? httpAgent : null,
      httpsAgent: mxConfig.keepAlive ? httpsAgent : null,
      headers: {
        origin: 'NftService',
      },
      clientName: 'nft-service',
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

      MetricsCollector.setExternalCall(MxApiService.name, profiler.duration, name);

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
      this.logger.error(`An error occurred while calling the mx api service on url ${resourceUrl}`, {
        path: `${MxApiService.name}.${name}`,
        error: customError,
      });
    }
  }

  async doPostGeneric(name: string, resourceUrl: string, payload: any): Promise<any> {
    try {
      const profiler = new PerformanceProfiler(`${name} ${resourceUrl}`);
      const response = await this.getService().doPostGeneric(resourceUrl, payload);
      profiler.stop();

      MetricsCollector.setExternalCall(MxApiService.name, profiler.duration, name);

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
      this.logger.error(`An error occurred while calling the mx api service on url ${resourceUrl}`, {
        path: `${MxApiService.name}.${name}`,
        error: customError,
      });
    }
  }

  async getAddressUsername(address: string): Promise<{ username: string }> {
    return await this.doGetGeneric(this.getAddressUsername.name, `accounts/${address}?fields=username`);
  }

  async getAccountSmartContracts(address: string, size: number): Promise<SmartContractApi[]> {
    return await this.doGetGeneric(this.getAccountSmartContracts.name, `accounts/${address}/contracts?size=${size}`);
  }

  async getAccountSmartContractsCount(address: string): Promise<number> {
    return await this.doGetGeneric(this.getAccountSmartContracts.name, `accounts/${address}/contracts/count`);
  }

  async getTokensForUser(address: string): Promise<Nft[]> {
    return await this.doGetGeneric(this.getTokensForUser.name, `accounts/${address}/tokens`);
  }

  async getNftByIdentifierAndAddress(address: string, identifier: string): Promise<Nft> {
    return await this.doGetGeneric(this.getNftByIdentifierAndAddress.name, `accounts/${address}/nfts/${identifier}`);
  }

  async getNftsByIdentifiers(identifiers: string[], offset: number = 0, query: string = 'withOwner=true&withSupply=true'): Promise<Nft[]> {
    query = `nfts${new AssetsQuery().addIdentifiers(identifiers).addPageSize(offset, identifiers.length).addQuery(query).build(false)}`;
    return await this.doGetGeneric(this.getNftsByIdentifiers.name, query);
  }

  async getNftByIdentifier(identifier: string): Promise<Nft> {
    return await this.doGetGeneric(this.getNftByIdentifier.name, `nfts/${identifier}`);
  }

  async getNftByIdentifierForQuery(identifier: string, query: string = 'withOwner=true&withSupply=true'): Promise<Nft> {
    const url = `nfts/${identifier}${new AssetsQuery(query).build()}`;
    return await this.doGetGeneric(this.getNftByIdentifier.name, url);
  }

  async getNftMetadataByIdentifierForQuery(
    identifier: string,
    query: string = 'fields=metadata&withOwner=true&withSupply=true',
  ): Promise<NftMetadata> {
    const url = `nfts/${identifier}${new AssetsQuery(query).build()}`;
    const res = await this.doGetGeneric(this.getNftMetadataByIdentifierForQuery.name, url);
    return res?.metadata;
  }

  async getOwnersForIdentifier(identifier: string, offset: number = 0, limit: number = 10): Promise<OwnerApi[]> {
    return await this.doGetGeneric(this.getNftByIdentifier.name, `nfts/${identifier}/accounts?from=${offset}&size=${limit}`);
  }

  async getOwnersForIdentifierCount(identifier: string): Promise<number> {
    return await this.doGetGeneric(this.getNftByIdentifier.name, `nfts/${identifier}/accounts/count`);
  }

  async getNftsForUser(address: string, query: string = ''): Promise<Nft[]> {
    const url = `accounts/${address}/nfts${new AssetsQuery(query).build()}`;
    return await this.doGetGeneric(this.getNftsForUser.name, url);
  }

  async getNftsForUserCount(address: string, query: string = ''): Promise<number> {
    const url = `accounts/${address}/nfts/count${new AssetsQuery(query).build()}`;
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

  async getNftsAndCount(nftsQuery: string = '', nftsCountQuery = ''): Promise<[Nft[], number]> {
    return [await this.getAllNfts(nftsQuery), await this.getNftsCount(nftsCountQuery)];
  }

  async getCollectionNftsAndCount(collection: string, nftsQuery: string = ''): Promise<[Nft[], number]> {
    return [await this.getCollectionNftsForQuery(collection, nftsQuery), await this.getCollectionNftsCountForQuery(collection, nftsQuery)];
  }

  async getNftsAndCountForAccount(ownerAddress: string, nftsQuery: string = '', nftsCountQuery = ''): Promise<[Nft[], number]> {
    return [await this.getNftsForUser(ownerAddress, nftsQuery), await this.getNftsForUserCount(ownerAddress, nftsCountQuery)];
  }

  async getNftsCountForCollection(query: string = '', collection): Promise<{ value: string; key: string }> {
    const url = `nfts/count${new AssetsQuery(query).withNsfwFlag().build()}`;
    const totalCount = await this.doGetGeneric(this.getNftsCount.name, url);
    return { key: collection, value: totalCount };
  }

  async getCollectionsByIdentifiers(identifiers: string[], offset: number = 0): Promise<CollectionApi[]> {
    return await this.doGetGeneric(
      this.getCollectionsByIdentifiers.name,
      `collections?identifiers=${identifiers}&size=${identifiers.length}&from=${offset}`,
    );
  }

  async getCollectionsForAddressWithRoles(address: string = '', query: string = ''): Promise<CollectionApi[]> {
    return await this.doGetGeneric(this.getCollectionsForAddressWithRoles.name, `accounts/${address}/roles/collections${query}`);
  }

  async getCollectionsForAddressWithNfts(address: string = '', query: string = ''): Promise<CollectionApi[]> {
    return await this.doGetGeneric(this.getCollectionsForAddressWithNfts.name, `accounts/${address}/collections${query}`);
  }

  async getCollectionNftsForQuery(collection: string = '', query: string = ''): Promise<Nft[]> {
    const url = `collections/${collection}/nfts${new AssetsQuery(query).build()}`;
    return await this.doGetGeneric(this.getCollectionNftsForQuery.name, url);
  }

  async getCollectionNftsCountForQuery(collection: string = '', query: string = ''): Promise<number> {
    const url = `collections/${collection}/nfts/count${new AssetsQuery(query).build()}`;
    return await this.doGetGeneric(this.getCollectionNftsForQuery.name, url);
  }

  async getCollectionByIdentifierForQuery(identifier: string = '', query: string = ''): Promise<CollectionApi> {
    return await this.doGetGeneric(this.getCollectionForIdentifier.name, `collections/${identifier}?${query}`);
  }

  async getCollectionForIdentifier(identifier: string = ''): Promise<CollectionApi> {
    return await this.doGetGeneric(this.getCollectionForIdentifier.name, `collections/${identifier}`);
  }

  async getCollectionForOwnerAndIdentifier(address: string, identifier: string): Promise<CollectionApi> {
    return await this.doGetGeneric(this.getCollectionForOwnerAndIdentifier.name, `accounts/${address}/roles/collections/${identifier}`);
  }

  async getCollectionsForAddressWithNftsCount(address: string = '', query: string = ''): Promise<number> {
    return await this.doGetGeneric(this.getCollectionsForAddressWithNftsCount.name, `accounts/${address}/collections/count${query}`);
  }

  async getCollectionsForAddressWithRolesCount(address: string = '', query: string = ''): Promise<number> {
    return await this.doGetGeneric(this.getCollectionsForAddressWithRolesCount.name, `accounts/${address}/roles/collections/count${query}`);
  }

  async getCollections(query: string = ''): Promise<CollectionApi[]> {
    return await this.doGetGeneric(this.getCollections.name, `collections${query}`);
  }

  async getCollectionsBySearch(searchTerm: string = '', size: number = 5): Promise<CollectionApi[]> {
    const requestedFields = 'collection,name,assets';
    return await this.doGetGeneric(
      this.getCollections.name,
      `collections?search=${encodeURIComponent(searchTerm)}&size=${size}&fields=${requestedFields}`,
    );
  }

  async getNftsBySearch(searchTerm: string = '', size: number = 5, fields: string = 'identifier,name'): Promise<Nft[]> {
    const url = `nfts${new AssetsQuery().addSearchTerm(searchTerm).addPageSize(0, size).addQuery(`&fields=${fields}`).build()}`;
    return await this.doGetGeneric(this.getNftsBySearch.name, url);
  }

  async getBulkNftRaritiesByIdentifiers(identifiers: string[]): Promise<Nft[]> {
    const batchSize = constants.getNftsFromApiBatchSize;
    let nfts: Nft[] = [];
    for (let i = 0; i < identifiers.length; i += batchSize) {
      const query = `nfts${new AssetsQuery()
        .addIdentifiers(identifiers.slice(i, i + batchSize))
        .addPageSize(0, batchSize)
        .addFields(['identifier', 'rank', 'score', 'rarities'])
        .build(false)}`;
      nfts = nfts.concat(await this.doGetGeneric(this.getNftsByIdentifiers.name, query));
    }
    return nfts;
  }

  async getAllNftsByCollectionAfterNonce(
    collection: string,
    fields: string = 'identifier,nonce,timestamp',
    maxNftsCount: number,
    startNonce: number = 1,
    endNonce: number = constants.nftsCountThresholdForTraitAndRarityIndexing,
  ): Promise<Nft[]> {
    const batchSize = constants.getNftsFromApiBatchSize;

    if (maxNftsCount < batchSize) {
      const query = new AssetsQuery().addPageSize(0, batchSize).addQuery(`fields=${fields}`);
      const url = `collections/${collection}/nfts${query.build(false)}`;
      return await this.doGetGeneric(this.getAllNftsByCollectionAfterNonce.name, url);
    }

    let nfts: Nft[] = [];
    let batch: Nft[] = [];

    let lastEnd: number;

    do {
      const start = lastEnd ? lastEnd + 1 : startNonce;
      let end: number;

      if (startNonce !== undefined && endNonce !== undefined) {
        end = Math.min(endNonce, start + batchSize);
      } else {
        end = start + batchSize;
      }

      const query = new AssetsQuery().addNonceAfter(start).addNonceBefore(end).addPageSize(0, batchSize).addQuery(`fields=${fields}`);

      const url = `collections/${collection}/nfts${query.build(false)}`;

      batch = await this.doGetGeneric(this.getAllNftsByCollectionAfterNonce.name, url);

      nfts = nfts.concat(batch);
      lastEnd = end;
    } while (nfts.length < maxNftsCount && (endNonce ? lastEnd < endNonce : true));

    return this.filterUniqueNftsByNonce(nfts);
  }

  async getScrollableNftsByCollectionAfterNonceDesc(
    collection: string,
    fields: string = 'identifier,nonce,timestamp',
    action: (nfts: Nft[]) => Promise<boolean | any>,
    collectionNftsCount: number,
  ): Promise<void> {
    const batchSize = constants.getNftsFromApiBatchSize;

    let nftsCount = 0;
    let lastMinNonce;
    let actionResult: boolean;

    do {
      const nonceBefore = lastMinNonce - 1;

      let query = new AssetsQuery().addPageSize(0, batchSize).addQuery(`fields=${fields}`);
      if (collectionNftsCount > batchSize && nonceBefore) {
        query = query.addNonceBefore(nonceBefore);
      }

      const url = `collections/${collection}/nfts${query.build()}`;

      const nfts = await this.doGetGeneric(this.getScrollableNftsByCollectionAfterNonceDesc.name, url);

      if (!nfts || nfts.length === 0) {
        break;
      }

      nftsCount += nfts.length;

      actionResult = await action(nfts);

      lastMinNonce = nfts[nfts.length - 1].nonce;
    } while (nftsCount < collectionNftsCount && lastMinNonce !== 1 && actionResult !== false);
  }

  async getNftsBeforeTimestamp(beforeTimestamp: number, size: number, fields: string[]): Promise<[Nft[], number]> {
    const query = new AssetsQuery().addBefore(beforeTimestamp).addPageSize(0, size).addFields(fields);
    const url = `nfts${query.build()}`;
    let nfts = await this.doGetGeneric(this.getNftsBeforeTimestamp.name, url);
    const lastTimestamp = nfts?.[nfts.length - 1]?.timestamp ?? beforeTimestamp;
    return [nfts, lastTimestamp];
  }

  async getNftsWithAttributesBeforeTimestamp(beforeTimestamp: number, size: number): Promise<[Nft[], number]> {
    let [nfts, lastTimestamp] = await this.getNftsBeforeTimestamp(beforeTimestamp, size, ['identifier', 'metadata', 'timestamp']);
    nfts = nfts?.filter((nft) => nft.metadata?.attributes);
    return [nfts, lastTimestamp];
  }

  async getTagsBySearch(searchTerm: string = ''): Promise<NftTag[]> {
    return await this.doGetGeneric(this.getTagsBySearch.name, `tags?search=${encodeURIComponent(searchTerm)}&size=5&fields=tag`);
  }

  async getTags(from: number = 0, size: number = 10, searchTerm: string = ''): Promise<NftTag[]> {
    const query = searchTerm !== '' ? `?search=${encodeURIComponent(searchTerm)}&` : '?';
    return await this.doGetGeneric(this.getTags.name, `tags${query}from=${from}&size=${size}`);
  }

  async getTagsCount(searchTerm: string = ''): Promise<number> {
    const query = searchTerm !== '' ? `?search=${encodeURIComponent(searchTerm)}` : '';
    return await this.doGetGeneric(this.getTagsCount.name, `tags/count${query}`);
  }

  async getCollectionsCount(query: string = ''): Promise<number> {
    return await this.doGetGeneric(this.getCollectionsCount.name, `collections/count${query}`);
  }

  async getAllDexTokens(): Promise<Token[]> {
    const allTokens = await this.doGetGeneric(this.getAllDexTokens.name, 'mex/tokens?size=10000');
    return allTokens.map((t) => Token.fromMxApiDexToken(t));
  }

  async getAllTokens(): Promise<Token[]> {
    const allTokens = await this.doGetGeneric(this.getAllTokens.name, 'tokens?size=10000&fields=identifier,name,ticker,decimals,price');
    return allTokens.map((t) => Token.fromMxApiToken(t));
  }

  async getEgldPriceFromEconomics(): Promise<string> {
    return await this.doGetGeneric(this.getEgldPriceFromEconomics.name, 'economics?extract=price');
  }

  async getTokenData(tokenId: string): Promise<Token | undefined> {
    const token = await this.doGetGeneric(this.getTokenData.name, `tokens/${tokenId}?fields=identifier,name,ticker,decimals,price`);
    return token
      ? new Token({
          ...token,
          symbol: token.ticker,
        })
      : undefined;
  }

  async getSmartContractOwner(address: string): Promise<{ address: string; owner: string }> {
    let scAddress = new Address(address);
    while (scAddress.isSmartContract() && scAddress.toBech32() !== XOXNO_MINTING_MANAGER) {
      const { ownerAddress } = await this.doGetGeneric(
        this.getSmartContractOwner.name,
        `accounts/${scAddress.toBech32()}?fields=ownerAddress`,
      );
      if (ownerAddress === scAddress.toBech32()) {
        return { address, owner: scAddress.toBech32() };
      }

      scAddress = Address.newFromBech32(ownerAddress);
    }
    return { address, owner: scAddress.toBech32() };
  }

  async getTransactionByHash(txHash: string): Promise<TransactionOnNetwork> {
    return await this.apiProvider.getTransaction(txHash);
  }

  async getCollectionNftsCount(ticker: string): Promise<number> {
    return await this.doGetGeneric(this.getCollectionNftsCount.name, `collections/${ticker}/nfts/count`);
  }

  async getCollectionPreferredAlgorithm(ticker: string): Promise<string | undefined> {
    const res = await this.doGetGeneric(this.getCollectionPreferredAlgorithm.name, `collections/${ticker}?fields=assets`);
    return res?.assets?.preferredRankAlgorithm;
  }

  async getCollectionCustomRanks(ticker: string): Promise<CustomRank[] | undefined> {
    const res = await this.doGetGeneric(this.getCollectionCustomRanks.name, `collections/${ticker}/ranks`);
    return res?.map(
      (nft) =>
        new CustomRank({
          identifier: nft.identifier,
          rank: nft.rank,
        }),
    );
  }

  async getMxStats(): Promise<MxStats> {
    const stats = await this.doGetGeneric(this.getMxStats.name, 'stats');
    return new MxStats(stats);
  }

  async getMxApiAbout(): Promise<MxApiAbout> {
    const about = await this.doGetGeneric(this.getMxStats.name, 'about');
    return new MxApiAbout(about);
  }

  private filterUniqueNftsByNonce(nfts: Nft[]): Nft[] {
    return nfts.distinct((nft) => nft.nonce);
  }
}
