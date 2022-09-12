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
import { CollectionApi, ElrondApiService, getSmartContract } from 'src/common';
import * as Redis from 'ioredis';
import { TransactionNode } from '../common/transaction';
import { CollectionsFilter } from '../common/filters/filtersTypes';
import {
  IssueCollectionRequest,
  StopNftCreateRequest,
  TransferNftCreateRoleRequest,
  SetNftRolesRequest,
} from './models/requests';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { CollectionsNftsCountRedisHandler } from './collection-nfts-count.redis-handler';
import { CollectionsNftsRedisHandler } from './collection-nfts.redis-handler';
import { TimeConstants } from 'src/utils/time-utils';
import { CachingService } from 'src/common/services/caching/caching.service';

@Injectable()
export class CollectionsService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
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
    return await this.getFilteredCollections(offset, limit, filters);
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
  ): Promise<[Collection[], number]> {
    let [collections, count] = await this.getFullCollections();

    if (filters?.collection) {
      collections = collections.filter(
        (token) => token.collection === filters.collection,
      );
      count = 1;
    }

    collections = collections?.slice(offset, offset + limit);

    return [collections, count];
  }

  async getFullCollections(): Promise<[Collection[], number]> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.AllCollections.key,
      async () => await this.getFullCollectionsRaw(),
      TimeConstants.oneHour,
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

  private async getMappedCollections(page: number, size: number) {
    const collections = await this.apiService.getCollections(
      new CollectionQuery().addPageSize(page, size).build(),
    );
    return collections?.map((collection) =>
      Collection.fromCollectionApi(collection),
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
