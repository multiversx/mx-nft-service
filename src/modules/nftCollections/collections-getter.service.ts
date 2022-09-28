import { Injectable } from '@nestjs/common';
import { orderBy } from 'lodash';
import {
  Address,
  AddressValue,
  BytesValue,
  ContractFunction,
  TokenPayment,
  TypedValue,
} from '@elrondnetwork/erdjs';
import { cacheConfig, elrondConfig, gas } from 'src/config';
import { SetNftRolesArgs } from './models/SetNftRolesArgs';
import { Collection, CollectionAsset } from './models';
import { CollectionQuery } from './collection-query';
import {
  CollectionApi,
  ElrondApiService,
  ElrondIdentityService,
  getSmartContract,
} from 'src/common';
import * as Redis from 'ioredis';
import { TransactionNode } from '../common/transaction';
import {
  IssueCollectionRequest,
  StopNftCreateRequest,
  TransferNftCreateRoleRequest,
  SetNftRolesRequest,
} from './models/requests';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { CollectionsNftsCountRedisHandler } from './collection-nfts-count.redis-handler';
import { CollectionsNftsRedisHandler } from './collection-nfts.redis-handler';
import { CachingService } from 'src/common/services/caching/caching.service';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { SmartContractArtistsService } from '../artists/smart-contract-artist.service';
import {
  CollectionsFilter,
  CollectionsSortingEnum,
} from './models/Collections-Filters';

@Injectable()
export class CollectionsGetterService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
    private idService: ElrondIdentityService,
    private smartContractArtistService: SmartContractArtistsService,
    private persistenceService: PersistenceService,
    private collectionNftsCountRedis: CollectionsNftsCountRedisHandler,
    private collectionNftsRedis: CollectionsNftsRedisHandler,
    private cacheService: CachingService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.collectionsRedisClientName,
    );
  }

  async getCollections(
    offset: number = 0,
    limit: number = 10,
    filters?: CollectionsFilter,
    sorting?: CollectionsSortingEnum,
  ): Promise<[Collection[], number]> {
    const apiQuery = new CollectionQuery()
      .addCreator(filters?.creatorAddress)
      .addType(filters?.type)
      .addCanCreate(filters?.canCreate)
      .addPageSize(offset, limit)
      .build();

    if (filters?.ownerAddress) {
      const [collections, count] = await this.getCollectionsForUser(
        filters,
        apiQuery,
      );
      return [
        collections?.map((element) => Collection.fromCollectionApi(element)),
        count,
      ];
    }

    if (filters?.activeLast30Days) {
      return await this.getFilteredActiveCollectionsFromLast30Days(
        offset,
        limit,
        filters,
        sorting,
      );
    }

    return await this.getFilteredCollections(offset, limit, filters, sorting);
  }

  async getTrendingCollections(
    offset: number = 0,
    limit: number = 10,
  ): Promise<[Collection[], number]> {
    let [collections, count] = await this.getAllTrendingCollections();

    collections = collections?.slice(offset, offset + limit);

    return [collections, count];
  }

  async getAllTrendingCollections(): Promise<[Collection[], number]> {
    const [trendingCollections] = await Promise.all([
      this.persistenceService.getTrendingCollections(),
      this.persistenceService.getTrendingCollectionsCount(),
    ]);
    const mappedCollections = [];
    const [collections] = await this.getOrSetFullCollections();
    for (const trendingCollection of trendingCollections) {
      mappedCollections.push(
        collections.find((c) => c.collection === trendingCollection.collection),
      );
    }
    return [mappedCollections, mappedCollections.length];
  }

  async getActiveCollectionsFromLast30Days(): Promise<[Collection[], number]> {
    const [trendingCollections] = await Promise.all([
      this.persistenceService.getActiveCollectionsLast30Days(),
      this.persistenceService.getActiveCollectionsLast30DaysCount(),
    ]);
    const mappedCollections = [];
    const [collections] = await this.getOrSetFullCollections();
    for (const trendingCollection of trendingCollections) {
      mappedCollections.push(
        collections.find((c) => c.collection === trendingCollection.collection),
      );
    }
    return [mappedCollections, mappedCollections.length];
  }

  async getFilteredActiveCollectionsFromLast30Days(
    offset: number = 0,
    limit: number = 10,
    filters?: CollectionsFilter,
    sorting?: CollectionsSortingEnum,
  ): Promise<[Collection[], number]> {
    let [activeCollections, count] =
      await this.getActiveCollectionsFromLast30Days();
    console.log(filters?.verified !== null, filters?.verified);
    if (this.hasVerifiedFilter(filters)) {
      activeCollections = activeCollections.filter(
        (token) => token.verified === filters?.verified,
      );
    }

    if (filters?.creatorAddress) {
      activeCollections = activeCollections.filter(
        (token) => token.artistAddress === filters?.creatorAddress,
      );
    }

    if (filters?.type) {
      activeCollections = activeCollections.filter(
        (token) => token.type === filters?.type,
      );
    }

    if (sorting && sorting === CollectionsSortingEnum.Newest) {
      count = orderBy(count, ['creationDate', 'verified'], ['desc', 'desc']);
    }
    count = activeCollections.length;
    activeCollections = activeCollections?.slice(offset, offset + limit);
    return [activeCollections, count];
  }

  private async getFilteredCollections(
    offset: number = 0,
    limit: number = 10,
    filters?: CollectionsFilter,
    sorting?: CollectionsSortingEnum,
  ): Promise<[Collection[], number]> {
    let [collections, count] = await this.getOrSetFullCollections();

    if (filters?.collection) {
      return [
        collections.filter((token) => token.collection === filters.collection),
        1,
      ];
    }

    if (this.hasVerifiedFilter(filters)) {
      collections = collections.filter(
        (token) => token.verified === filters?.verified,
      );
    }

    if (filters?.creatorAddress) {
      collections = collections.filter(
        (token) => token.artistAddress === filters?.creatorAddress,
      );
    }

    if (filters?.type) {
      collections = collections.filter((token) => token.type === filters?.type);
    }

    if (sorting && sorting === CollectionsSortingEnum.Newest) {
      collections = orderBy(
        collections,
        ['creationDate', 'verified'],
        ['desc', 'desc'],
      );
    }
    count = collections.length;
    collections = collections?.slice(offset, offset + limit);
    return [collections, count];
  }

  private hasVerifiedFilter(filters: CollectionsFilter) {
    return filters?.verified !== null && filters?.verified !== undefined;
  }

  async getOrSetFullCollections(): Promise<[Collection[], number]> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.AllCollections.key,
      async () => await this.getFullCollectionsRaw(),
      CacheInfo.AllCollections.ttl,
    );
  }

  public async getFullCollectionsRaw(): Promise<[Collection[], number]> {
    const size = 25;
    let from = 0;

    const totalCount = await this.apiService.getCollectionsCount();
    let collectionsResponse: Collection[] = [];
    do {
      let mappedCollections = await this.getMappedCollections(from, size);

      mappedCollections = await this.mapCollectionNftsCount(mappedCollections);

      mappedCollections = await this.mapCollectionNfts(mappedCollections);

      collectionsResponse.push(...mappedCollections);

      from = from + size;
    } while (from < totalCount && from <= 9975);
    let uniqueCollections = [
      ...new Map(
        collectionsResponse.map((item) => [item.collection, item]),
      ).values(),
    ];
    uniqueCollections = orderBy(
      uniqueCollections,
      ['verified', 'creationDate'],
      ['desc', 'desc'],
    );

    return [uniqueCollections, uniqueCollections?.length];
  }

  async getOrSetMostActiveCollections(): Promise<[Collection[], number]> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.CollectionsMostActive.key,
      async () => await this.getMostActiveCollections(),
      CacheInfo.CollectionsMostActive.ttl,
    );
  }

  public async getMostActiveCollections(): Promise<[Collection[], number]> {
    const [collections] = await this.getOrSetFullCollections();
    let groupedCollections = collections
      .groupBy((x) => x.artistAddress, true)
      .map((group: { key: any; values: any[] }) => ({
        artist: group.key,
        nfts: group.values.sum((x) => x.nftsCount),
      }))
      .sortedDescending((x: { nfts: any }) => x.nfts);

    return [groupedCollections, groupedCollections.length];
  }

  async getOrSetMostFollowedCollections(): Promise<[Collection[], number]> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.CollectionsMostFollowed.key,
      async () => await this.getMostFollowedCollections(),
      CacheInfo.CollectionsMostFollowed.ttl,
    );
  }

  public async getMostFollowedCollections(): Promise<[Collection[], number]> {
    const [collections] = await this.getOrSetFullCollections();
    let groupedCollections = collections
      .groupBy((x) => x.artistAddress, true)
      .map((group: { key: any; values: any[] }) => ({
        artist: group.key,
        followersCount: group.values[0].artistFollowersCount,
      }))
      .sortedDescending((x: { followersCount: any }) => x.followersCount);

    return [groupedCollections, groupedCollections.length];
  }

  private async getMappedCollections(
    page: number,
    size: number,
  ): Promise<Collection[]> {
    const collections = await this.apiService.getCollections(
      new CollectionQuery().addPageSize(page, size).build(),
    );
    const promisesCollections = collections?.map(
      (collection): Promise<Collection> => this.mapCollection(collection),
    );
    return await Promise.all(promisesCollections);
  }

  private async mapCollection(collection: CollectionApi): Promise<Collection> {
    const ownerAddress = new Address(collection.owner);
    if (ownerAddress.isContractAddress()) {
      const artist =
        await this.smartContractArtistService.getOrSetArtistForScAddress(
          collection.owner,
        );
      const followersCount = await this.idService.getFollowersCount(
        artist.owner,
      );
      return Collection.fromCollectionApi(
        collection,
        artist?.owner,
        followersCount?.count,
      );
    }
    const followersCount = await this.idService.getFollowersCount(
      collection.owner,
    );
    return Collection.fromCollectionApi(
      collection,
      collection.owner,
      followersCount?.count,
    );
  }

  private async mapCollectionNfts(localCollections: Collection[]) {
    let nftsGroupByCollection = await this.collectionNftsRedis.batchLoad(
      localCollections?.map((item) => item.collection),
    );

    for (const collection of localCollections) {
      for (const groupByCollection of nftsGroupByCollection) {
        if (collection.collection === groupByCollection.key) {
          collection.collectionAsset = {
            ...collection.collectionAsset,
            assets: groupByCollection.value,
          };
        }
      }
    }

    return localCollections;
  }

  private async mapCollectionNftsCount(localCollections: Collection[]) {
    const nftsCountResponse = await this.collectionNftsCountRedis.batchLoad(
      localCollections.map((collection) => collection.collection),
    );

    for (const collectionNftsCount of nftsCountResponse) {
      for (const collection of localCollections) {
        if (collection.collection == collectionNftsCount.key) {
          collection.nftsCount = collectionNftsCount.value;
          collection.collectionAsset = new CollectionAsset({
            collectionIdentifer: collectionNftsCount.key,
            totalCount: collectionNftsCount.value,
          });
        }
      }
    }
    localCollections = localCollections.filter(
      (x) => parseInt(x.collectionAsset?.totalCount) >= 4,
    );
    return localCollections;
  }

  private async getCollectionsForUser(
    filters: CollectionsFilter,
    query: string = '',
  ): Promise<[CollectionApi[], number]> {
    if (filters?.collection) {
      const collection =
        await this.apiService.getCollectionForOwnerAndIdentifier(
          filters.ownerAddress,
          filters.collection,
        );
      return [[collection], collection ? 1 : 0];
    }
    const [collectionsApi, count] = await Promise.all([
      this.apiService.getCollectionsForAddress(filters.ownerAddress, query),
      this.apiService.getCollectionsForAddressCount(
        filters.ownerAddress,
        query,
      ),
    ]);
    return [collectionsApi, count];
  }
}
