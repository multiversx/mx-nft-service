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
export class CollectionsService {
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

  async issueToken(ownerAddress: string, request: IssueCollectionRequest) {
    let transactionArgs = this.getIssueTokenArguments(request);

    const transaction = this.esdtSmartContract.call({
      func: new ContractFunction(request.collectionType),
      value: TokenPayment.egldFromBigInteger(elrondConfig.issueNftCost),
      args: transactionArgs,
      gasLimit: gas.issueToken,
      chainID: elrondConfig.chainID,
    });
    return transaction.toPlainObject(new Address(ownerAddress));
  }

  async stopNFTCreate(
    ownerAddress: string,
    request: StopNftCreateRequest,
  ): Promise<TransactionNode> {
    const smartContract = getSmartContract(request.ownerAddress);
    const transaction = smartContract.call({
      func: new ContractFunction('stopNFTCreate'),
      value: TokenPayment.egldFromAmount(0),
      args: [BytesValue.fromUTF8(request.collection)],
      gasLimit: gas.stopNFTCreate,
      chainID: elrondConfig.chainID,
    });
    return transaction.toPlainObject(new Address(ownerAddress));
  }

  async transferNFTCreateRole(
    ownerAddress: string,
    request: TransferNftCreateRoleRequest,
  ): Promise<TransactionNode> {
    const smartContract = getSmartContract(request.ownerAddress);
    let transactionArgs = this.getTransferCreateRoleArgs(request);
    const transaction = smartContract.call({
      func: new ContractFunction('transferNFTCreateRole'),
      value: TokenPayment.egldFromAmount(0),
      args: transactionArgs,
      gasLimit: gas.transferNFTCreateRole,
      chainID: elrondConfig.chainID,
    });
    return transaction.toPlainObject(new Address(ownerAddress));
  }

  async setNftRoles(
    ownerAddress: string,
    args: SetNftRolesRequest,
  ): Promise<TransactionNode> {
    let transactionArgs = this.getSetRolesArgs(args);
    const transaction = this.esdtSmartContract.call({
      func: new ContractFunction('setSpecialRole'),
      value: TokenPayment.egldFromAmount(0),
      args: transactionArgs,
      gasLimit: gas.setRoles,
      chainID: elrondConfig.chainID,
    });
    return transaction.toPlainObject(new Address(ownerAddress));
  }

  async getCollections(
    offset: number = 0,
    limit: number = 10,
    filters: CollectionsFilter,
    sorting: CollectionsSortingEnum,
  ): Promise<[Collection[], number]> {
    const apiQuery = new CollectionQuery()
      .addCreator(filters?.creatorAddress)
      .addType(filters?.type)
      .addCanCreate(filters?.canCreate)
      .addPageSize(offset, limit)
      .build();

    if (filters && Object.keys(filters).length > 0) {
      if (filters.ownerAddress) {
        const [collections, count] = await this.getCollectionsForUser(
          filters,
          apiQuery,
        );
        return [
          collections?.map((element) => Collection.fromCollectionApi(element)),
          count,
        ];
      }
      return await this.getAllCollections(filters, apiQuery);
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

  private async getAllCollections(
    filters: CollectionsFilter,
    query: string = '',
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
    const [collectionsApi, count] = await Promise.all([
      this.apiService.getCollections(query),
      this.apiService.getCollectionsCount(query),
    ]);
    const collections = collectionsApi?.map((element) =>
      Collection.fromCollectionApi(element),
    );
    return [collections, count];
  }

  private async getFilteredCollections(
    offset: number = 0,
    limit: number = 10,
    filters: CollectionsFilter,
    sorting: CollectionsSortingEnum,
  ): Promise<[Collection[], number]> {
    let [collections, count] = await this.getOrSetFullCollections();

    if (filters?.collection) {
      collections = collections.filter(
        (token) => token.collection === filters.collection,
      );
      count = 1;
    }

    if (sorting && sorting === CollectionsSortingEnum.Newest) {
      collections = orderBy(
        collections,
        ['creationDate', 'verified'],
        ['desc', 'desc'],
      );
    }

    collections = collections?.slice(offset, offset + limit);
    return [collections, count];
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

  private getIssueTokenArguments(args: IssueCollectionRequest) {
    let transactionArgs = [
      BytesValue.fromUTF8(args.tokenName),
      BytesValue.fromUTF8(args.tokenTicker),
    ];
    if (args.canFreeze) {
      transactionArgs.push(BytesValue.fromUTF8('canFreeze'));
      transactionArgs.push(BytesValue.fromUTF8(args.canFreeze.toString()));
    }
    if (args.canWipe) {
      transactionArgs.push(BytesValue.fromUTF8('canWipe'));
      transactionArgs.push(BytesValue.fromUTF8(args.canWipe.toString()));
    }
    if (args.canPause) {
      transactionArgs.push(BytesValue.fromUTF8('canPause'));
      transactionArgs.push(BytesValue.fromUTF8(args.canPause.toString()));
    }
    if (args.canTransferNFTCreateRole) {
      transactionArgs.push(BytesValue.fromUTF8('canTransferNFTCreateRole'));
      transactionArgs.push(
        BytesValue.fromUTF8(args.canTransferNFTCreateRole.toString()),
      );
    }
    return transactionArgs;
  }

  private getSetRolesArgs(args: SetNftRolesArgs) {
    let transactionArgs = [
      BytesValue.fromUTF8(args.collection),
      new AddressValue(new Address(args.addressToTransfer)),
    ];
    args.roles.forEach((role) => {
      transactionArgs.push(BytesValue.fromUTF8(role));
    });
    return transactionArgs;
  }

  private getTransferCreateRoleArgs(args: TransferNftCreateRoleRequest) {
    let transactionArgs: TypedValue[] = [BytesValue.fromUTF8(args.collection)];
    args.addressToTransferList.forEach((address) => {
      transactionArgs.push(new AddressValue(new Address(address)));
    });
    return transactionArgs;
  }

  private readonly esdtSmartContract = getSmartContract(
    elrondConfig.esdtNftAddress,
  );
}
