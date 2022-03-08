import { Injectable } from '@nestjs/common';
import {
  Address,
  AddressValue,
  Balance,
  BytesValue,
  ContractFunction,
  GasLimit,
  TypedValue,
} from '@elrondnetwork/erdjs';
import { cacheConfig, elrondConfig, gas } from 'src/config';
import { SetNftRolesArgs } from './models/SetNftRolesArgs';
import { Collection, CollectionAsset, CollectionAssetModel } from './models';
import { CollectionQuery } from './collection-query';
import {
  CollectionApi,
  ElrondApiService,
  getSmartContract,
  RedisCacheService,
} from 'src/common';
import * as Redis from 'ioredis';
import { TransactionNode } from '../common/transaction';
import { CollectionsFilter } from '../common/filters/filtersTypes';
import {
  IssueCollectionRequest,
  StopNftCreateRequest,
  TransferNftCreateRoleRequest,
  SetNftRolesRequest,
} from './models/requests';
import { AssetsQuery } from '../assets/assets-query';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { CacheService } from 'src/common/services/caching/cache.service';

@Injectable()
export class CollectionsService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
    private redisCacheService: RedisCacheService,
    private cacheService: CacheService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  private readonly esdtSmartContract = getSmartContract(
    elrondConfig.esdtNftAddress,
  );

  async issueToken(request: IssueCollectionRequest) {
    let transactionArgs = this.getIssueTokenArguments(request);

    const transaction = this.esdtSmartContract.call({
      func: new ContractFunction(request.collectionType),
      value: Balance.fromString(elrondConfig.issueNftCost),
      args: transactionArgs,
      gasLimit: new GasLimit(gas.issueToken),
    });
    return transaction.toPlainObject();
  }

  async stopNFTCreate(request: StopNftCreateRequest): Promise<TransactionNode> {
    const smartContract = getSmartContract(request.ownerAddress);
    const transaction = smartContract.call({
      func: new ContractFunction('stopNFTCreate'),
      value: Balance.egld(0),
      args: [BytesValue.fromUTF8(request.collection)],
      gasLimit: new GasLimit(gas.stopNFTCreate),
    });
    return transaction.toPlainObject();
  }

  async transferNFTCreateRole(
    request: TransferNftCreateRoleRequest,
  ): Promise<TransactionNode> {
    const smartContract = getSmartContract(request.ownerAddress);
    let transactionArgs = this.getTransferCreateRoleArgs(request);
    const transaction = smartContract.call({
      func: new ContractFunction('transferNFTCreateRole'),
      value: Balance.egld(0),
      args: transactionArgs,
      gasLimit: new GasLimit(gas.transferNFTCreateRole),
    });
    return transaction.toPlainObject();
  }

  async setNftRoles(args: SetNftRolesRequest): Promise<TransactionNode> {
    let transactionArgs = this.getSetRolesArgs(args);
    const transaction = this.esdtSmartContract.call({
      func: new ContractFunction('setSpecialRole'),
      value: Balance.egld(0),
      args: transactionArgs,
      gasLimit: new GasLimit(gas.setRoles),
    });
    return transaction.toPlainObject();
  }

  async getCollections(
    offset: number = 0,
    limit: number = 10,
    filters: CollectionsFilter,
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

    return await this.getAllCollections(filters, apiQuery);
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

  async getFilteredCollections(
    offset: number = 0,
    limit: number = 10,
    filters: CollectionsFilter,
  ): Promise<[Collection[], number]> {
    let [collections, count] = await this.getFullCollections();

    if (filters?.collection) {
      collections = collections.filter(
        (token) => token.collection === filters.collection,
      );
      count = 1;
    }

    collections = collections.filter(
      (token) => parseInt(token.collectionAsset.totalCount) >= 4,
    );
    collections = collections.slice(offset, offset + limit);

    return [collections, count];
  }

  async getFullCollections(): Promise<[Collection[], number]> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.AllCollections.key,
      async () => await this.getFullCollectionsRaw(),
      CacheInfo.AllCollections.ttl,
    );
  }

  public async getFullCollectionsRaw(): Promise<[Collection[], number]> {
    const size = 25;
    let page = 0;

    const totalCount = await this.apiService.getCollectionsCount('');
    let collectionsResponse: Collection[] = [];
    do {
      const collections = await this.apiService.getCollections(
        `?source=elastic&from=${page}&size=${size}`,
      );
      let localCollections = collections.map((collection) =>
        Collection.fromCollectionApi(collection),
      );
      let getNftsCollections = await this.getCollectionNftsCount(
        localCollections,
      );

      await this.getCollectionAssets(getNftsCollections, localCollections);
      collectionsResponse.push(...localCollections);
      page = page + size;
    } while (page < totalCount);

    console.log('Update redis');
    return [collectionsResponse, totalCount];
  }

  private async getCollectionAssets(
    getNftsCollections: any[],
    localCollections: Collection[],
  ) {
    let nftsGroupByCollection = await this.getNftsRaw(getNftsCollections);

    localCollections.forEach((el) => {
      nftsGroupByCollection.forEach((item) => {
        if (el.collection == item.key)
          el.collectionAsset = {
            ...el.collectionAsset,
            assets: item.value,
          };
      });
    });
    return localCollections;
  }

  private async getCollectionNftsCount(localCollections: Collection[]) {
    let getNftsCollections = [];
    const nftsCountResponse = await this.getNftCountsRaw(
      localCollections.map((collection) => collection.collection),
    );
    for (const nftCount of nftsCountResponse) {
      for (const el of localCollections) {
        if (el.collection == nftCount.collection)
          el.collectionAsset = new CollectionAsset({
            totalCount: nftCount.totalCount,
          });
      }

      if (parseInt(nftCount?.totalCount) > 0) {
        getNftsCollections.push(nftCount.collection);
      }
    }
    return getNftsCollections;
  }

  private async getNftCountsRaw(collections: string[]) {
    const cacheKeys = this.getCacheKeys('collectionAssetsCount', collections);
    let [redisKeys, values] = [cacheKeys, []];
    const getDataFromRedis = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    const returnValues: { key: string; value: any }[] = [];
    for (let index = 0; index < collections.length; index++) {
      returnValues.push({
        key: collections[index],
        value: getDataFromRedis[index],
      });
    }

    const getNotCachedNfts = returnValues
      .filter((item) => item.value === null)
      .map((value) => value.key);

    if (getDataFromRedis.includes(null)) {
      let data = await this.getNftsCount(getNotCachedNfts);

      returnValues.forEach((item) => {
        if (item.value === null) item.value = data[item.key][0];
      });

      values = returnValues.map((item) => {
        return item.value || 0;
      });

      await this.redisCacheService.batchSetCache(
        this.redisClient,
        redisKeys,
        values,
        CacheInfo.AllCollections.ttl,
      );
      return values;
    }
    return getDataFromRedis;
  }

  private async getNftsRaw(collections: string[]) {
    const cacheKeys = this.getCacheKeys('collectionAssets', collections);
    let [redisKeys, values] = [cacheKeys, []];
    const getDataFromRedis = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    const returnValues: { key: string; value: any }[] = [];
    for (let index = 0; index < collections.length; index++) {
      returnValues.push({
        key: collections[index],
        value: getDataFromRedis[index],
      });
    }

    const getNotCachedNfts = returnValues
      .filter((item) => item.value === null)
      .map((value) => value.key);
    if (getDataFromRedis.includes(null)) {
      let data = await this.getNfts(getNotCachedNfts);

      returnValues.forEach((item) => {
        if (item.value === null)
          item.value = data[item.key].map((a) =>
            CollectionAssetModel.fromNft(a),
          );
      });
      values = returnValues;

      await this.redisCacheService.batchSetCache(
        this.redisClient,
        redisKeys,
        values,
        CacheInfo.AllCollections.ttl,
      );
      return values;
    }
    return getDataFromRedis;
  }

  async getNftsCount(identifiers: string[]) {
    const getCountPromises = identifiers.map((identifier) =>
      this.apiService.getNftsCountForCollection(
        this.getQueryForCollection(identifier),
        identifier,
      ),
    );

    const nftsCountResponse = await Promise.all(getCountPromises);
    return nftsCountResponse?.groupBy((item) => item.collection);
  }

  async getNfts(identifiers: string[]): Promise<any> {
    let getNftsPromises = identifiers.map((collection) =>
      this.apiService.getAllNfts(
        `${this.getQueryForCollection(
          collection,
        )}&fields=media,identifier,collection`,
      ),
    );

    let nftsResponse = await Promise.all(getNftsPromises);
    let nftsGroupByCollection: { [key: string]: any[] } = {};

    nftsResponse.forEach((nfts) => {
      nftsGroupByCollection[nfts[0]?.collection] = nfts;
    });
    return nftsGroupByCollection;
  }

  private getQueryForCollection(identifier: string): string {
    return new AssetsQuery()
      .addCollection(identifier)
      .addPageSize(0, 4)
      .build();
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

  getCacheKeys(cacheConstant: string, key: string[]) {
    return key.map((id) => this.getCacheKey(cacheConstant, id));
  }

  getCacheKey(cacheConstant: string, key: string) {
    return generateCacheKeyFromParams(cacheConstant, key);
  }
}
