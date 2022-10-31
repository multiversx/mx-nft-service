import { Injectable } from '@nestjs/common';
import { orderBy } from 'lodash';
import { Address } from '@elrondnetwork/erdjs';
import { cacheConfig, genericDescriptions } from 'src/config';
import { Collection, CollectionAsset } from './models';
import { CollectionQuery } from './collection-query';
import {
  CollectionApi,
  ElrondApiService,
  ElrondIdentityService,
} from 'src/common';
import * as Redis from 'ioredis';
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
import { randomBetween } from 'src/utils/helpers';
import { CollectionNftTrait } from '../nft-traits/models/collection-traits.model';

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
    if (filters?.collection) {
      const collection = await this.apiService.getCollectionForIdentifier(
        filters.collection,
      );
      return [
        [Collection.fromCollectionApi(collection)],
        Collection.fromCollectionApi(collection) ? 1 : 0,
      ];
    }

    if (sorting === CollectionsSortingEnum.Trending) {
      return this.getTrendingCollections(offset, limit, filters);
    }

    if (filters?.ownerAddress) {
      return await this.getCollectionsForUser(offset, limit, filters);
    }

    if (filters?.artistAddress) {
      return await this.getCollectionsByArtist(offset, limit, filters);
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
    filters?: CollectionsFilter,
  ): Promise<[Collection[], number]> {
    let [trendingCollections] = await this.getOrSetTrendingCollections();
    trendingCollections = this.applyFilters(filters, trendingCollections);
    const count = trendingCollections.length;
    trendingCollections = trendingCollections?.slice(offset, offset + limit);
    return [trendingCollections, count];
  }

  async getOrSetTrendingCollections(): Promise<[Collection[], number]> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.TrendingCollections.key,
      async () => await this.getAllTrendingCollections(),
      CacheInfo.TrendingCollections.ttl,
    );
  }

  async getAllTrendingCollections(): Promise<[Collection[], number]> {
    const [trendingCollections] = await Promise.all([
      this.persistenceService.getTrendingCollections(),
      this.persistenceService.getTrendingCollectionsCount(),
    ]);
    const mappedCollections = [];
    const [collections] = await this.getOrSetFullCollections();
    for (const trendingCollection of trendingCollections) {
      const mappedCollection = collections.find(
        (c) => c.collection === trendingCollection.collection,
      );
      if (mappedCollection) mappedCollections.push(mappedCollection);
    }
    return [mappedCollections, mappedCollections.length];
  }

  async getOrSetActiveCollectionsFromLast30Days(): Promise<
    [Collection[], number]
  > {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.ActiveCollectionLast30Days.key,
      async () => await this.getActiveCollectionsFromLast30Days(),
      CacheInfo.ActiveCollectionLast30Days.ttl,
    );
  }

  async getActiveCollectionsFromLast30Days(): Promise<[Collection[], number]> {
    const [activeCollections] = await Promise.all([
      this.persistenceService.getActiveCollectionsLast30Days(),
      this.persistenceService.getActiveCollectionsLast30DaysCount(),
    ]);
    const mappedCollections = [];
    const [collections] = await this.getOrSetFullCollections();
    for (const trendingCollection of activeCollections) {
      const mappedCollection = collections.find(
        (c) => c.collection === trendingCollection.collection,
      );
      if (mappedCollection) mappedCollections.push(mappedCollection);
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
      await this.getOrSetActiveCollectionsFromLast30Days();
    activeCollections = this.applyFilters(filters, activeCollections);

    if (sorting && sorting === CollectionsSortingEnum.Newest) {
      activeCollections = orderBy(
        activeCollections,
        ['creationDate', 'verified'],
        ['desc', 'desc'],
      );
    }
    count = activeCollections.length;
    activeCollections = activeCollections?.slice(offset, offset + limit);
    return [activeCollections, count];
  }

  private applyFilters(filters: CollectionsFilter, collections: Collection[]) {
    if (this.hasVerifiedFilter(filters)) {
      collections = collections?.filter(
        (token) => token.verified === filters?.verified,
      );
    }

    if (filters?.creatorAddress) {
      collections = collections?.filter(
        (token) => token.artistAddress === filters?.creatorAddress,
      );
    }

    if (filters?.type) {
      collections = collections?.filter(
        (token) => token.type === filters?.type,
      );
    }
    return collections;
  }

  private async getFilteredCollections(
    offset: number = 0,
    limit: number = 10,
    filters?: CollectionsFilter,
    sorting?: CollectionsSortingEnum,
  ): Promise<[Collection[], number]> {
    let [collections, count] = await this.getOrSetFullCollections();

    collections = this.applyFilters(filters, collections);
    collections = collections.filter((c) => c.nftsCount > 4);
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

  async getOrSetMostActiveCollections(): Promise<
    [{ artist: string; nfts: number; collections: string[] }[], number]
  > {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.CollectionsMostActive.key,
      async () => await this.getMostActiveCollections(),
      CacheInfo.CollectionsMostActive.ttl,
    );
  }

  async getArtistCreations(
    address: string,
  ): Promise<{ artist: string; nfts: number; collections: string[] }> {
    const [collections] = await this.getOrSetMostActiveCollections();
    const response = collections.find((x) => x.artist === address);
    return response;
  }

  public async getMostActiveCollections(): Promise<
    [{ artist: string; nfts: number; collections: string[] }[], number]
  > {
    const [collections] = await this.getOrSetFullCollections();
    let groupedCollections = collections
      .groupBy((x) => x.artistAddress, true)
      .map((group: { key: any; values: any[] }) => ({
        artist: group.key,
        nfts: group.values.sum((x) => x.nftsCount),
        collections: [...new Set(group.values.map((x) => x.collection))],
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

    return localCollections;
  }

  private async getCollectionsForUser(
    offset: number = 0,
    limit: number = 10,
    filters?: CollectionsFilter,
  ): Promise<[Collection[], number]> {
    const query = new CollectionQuery()
      .addCreator(filters?.creatorAddress)
      .addType(filters?.type)
      .addCanCreate(filters?.canCreate)
      .addPageSize(offset, limit)
      .build();
    if (filters?.collection) {
      const collection =
        await this.apiService.getCollectionForOwnerAndIdentifier(
          filters.ownerAddress,
          filters.collection,
        );
      return [[Collection.fromCollectionApi(collection)], collection ? 1 : 0];
    }

    if (filters?.withNfts) {
      const [collectionsApi, count] = await Promise.all([
        this.apiService.getCollectionsForAddressWithNfts(
          filters.ownerAddress,
          query,
        ),
        this.apiService.getCollectionsForAddressWithNftsCount(
          filters.ownerAddress,
          query,
        ),
      ]);
      return [
        collectionsApi?.map((element) => Collection.fromCollectionApi(element)),
        count,
      ];
    }
    const [collectionsApi, count] = await Promise.all([
      this.apiService.getCollectionsForAddressWithRoles(
        filters.ownerAddress,
        query,
      ),
      this.apiService.getCollectionsForAddressWithRolesCount(
        filters.ownerAddress,
        query,
      ),
    ]);
    return [
      collectionsApi?.map((element) => Collection.fromCollectionApi(element)),
      count,
    ];
  }

  private async getCollectionsByArtist(
    offset: number = 0,
    limit: number = 100,
    filters?: CollectionsFilter,
  ): Promise<[Collection[], number]> {
    const artistCollections = await this.getArtistCreations(
      filters.artistAddress,
    );
    let collectionIdentifiers = artistCollections?.collections?.slice(
      offset,
      limit,
    );
    if (!collectionIdentifiers) {
      return [[], 0];
    }
    let [collections] = await this.getOrSetFullCollections();
    const filteredCollection = collections.filter((c) =>
      collectionIdentifiers?.includes(c.collection),
    );
    return [filteredCollection, artistCollections?.nfts];
  }

  async getRandomCollectionDescription(node: Collection): Promise<string> {
    const size =
      node.nftsCount ??
      (await this.apiService.getCollectionNftsCount(node.collection));

    const descriptions =
      size > 100
        ? genericDescriptions.forBigCollections
        : genericDescriptions.forSmallCollections;
    const randomIdx = randomBetween(0, descriptions.length);
    return descriptions[randomIdx].replace('{size}', size.toString());
  }

  async getCollectionTraits(
    collection: string,
  ): Promise<CollectionNftTrait[] | undefined> {
    const traitSummary = await this.persistenceService.getTraitSummary(
      collection,
    );
    if (!traitSummary || !traitSummary?.traitTypes) {
      return undefined;
    }
    return CollectionNftTrait.fromCollectionTraits(traitSummary.traitTypes);
  }
}
