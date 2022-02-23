import {
  Address,
  AddressValue,
  Balance,
  BytesValue,
  ContractFunction,
  GasLimit,
  U64Value,
} from '@elrondnetwork/erdjs';
import { Inject, Injectable } from '@nestjs/common';
import {
  ElrondApiService,
  getSmartContract,
  RedisCacheService,
} from 'src/common';
import { cacheConfig, elrondConfig, gas } from 'src/config';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import '../../utils/extentions';
import { nominateVal } from '../../utils/formatters';
import { FileContent } from '../ipfs/file.content';
import { PinataService } from '../ipfs/pinata.service';
import { S3Service } from '../s3/s3.service';
import { AssetsLikesService } from './assets-likes.service';
import { AssetsQuery } from '.';
import {
  CreateNftArgs,
  TransferNftArgs,
  Asset,
  HandleQuantityArgs,
  CollectionType,
} from './models';
import BigNumber from 'bignumber.js';
import * as Redis from 'ioredis';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AssetScamInfoProvider } from './assets-scam-info.loader';
import { AssetsSupplyLoader } from './assets-supply.loader';
import { AssetsFilter } from '../common/filters/filtersTypes';
import { TransactionNode } from '../common/transaction';
const hash = require('object-hash');

@Injectable()
export class AssetsService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
    private pinataService: PinataService,
    private assetScamLoader: AssetScamInfoProvider,
    private assetSupplyLoader: AssetsSupplyLoader,
    private s3Service: S3Service,
    private assetsLikedService: AssetsLikesService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getAssetsForUser(
    address: string,
    query: string = '',
  ): Promise<CollectionType<Asset>> {
    const [nfts, count] = await Promise.all([
      this.apiService.getNftsForUser(
        address,
        query + '&withMetadata=true&includeFlagged=true',
      ),
      this.apiService.getNftsForUserCount(address, query),
    ]);
    const assets = nfts?.map((element) => Asset.fromNft(element));
    return new CollectionType({ count, items: assets });
  }

  async getAssets(
    offset: number = 0,
    limit: number = 10,
    filters: AssetsFilter,
  ): Promise<CollectionType<Asset>> {
    const apiQuery = new AssetsQuery()
      .addCreator(filters?.creatorAddress)
      .addTags(filters?.tags)
      .addIdentifiers(filters?.identifiers)
      .addCollection(filters?.collection)
      .addType(filters?.type)
      .addPageSize(offset, limit)
      .build();

    if (filters?.likedByAddress) {
      const response = await this.getlikedByAssets(
        filters.likedByAddress,
        limit,
        offset,
      );
      this.addToCache(response);
      return response;
    }
    if (filters?.ownerAddress) {
      const response = await this.getAssetsByOwnerAddress(filters, apiQuery);
      await this.addToCache(response);
      return new CollectionType({
        count: response?.count,
        items: response?.items?.map((a) => {
          return { ...a, ownerAddress: filters?.ownerAddress };
        }),
      });
    }

    const response = await this.getAssetsWithoutOwner(filters, apiQuery);
    this.addToCache(response);
    return response;
  }

  private async addToCache(response: CollectionType<Asset>) {
    if (response?.count && response?.items) {
      let assetsWithScamInfo = response.items.filter((x) => x.scamInfo);
      await this.assetScamLoader.batchScamInfo(
        assetsWithScamInfo?.map((a) => a.identifier),
        assetsWithScamInfo?.groupBy((asset) => asset.identifier),
      );

      let assetsWithSupply = response.items.filter((x) => x.supply);
      await this.assetSupplyLoader.batchSupplyInfo(
        assetsWithSupply?.map((a) => a.identifier),
        assetsWithSupply?.groupBy((asset) => asset.identifier),
      );
    }
  }

  async getAssetsForCollection(
    filters: AssetsFilter,
    limit: number = 4,
  ): Promise<[any[], string]> {
    const apiQuery = new AssetsQuery()
      .addCollection(filters?.collection)
      .addPageSize(0, limit)
      .build();

    return await this.getCollectionAssets(apiQuery);
  }

  async getAssetByIdentifierAndAddress(
    onwerAddress: string,
    identifier: string,
  ): Promise<Asset> {
    const nft = await this.apiService.getNftByIdentifierAndAddress(
      onwerAddress,
      identifier,
    );
    return Asset.fromNft(nft);
  }

  private async getAsset(identifier): Promise<CollectionType<Asset>> {
    try {
      const cacheKey = this.getAssetsCacheKey(identifier);
      const getAsset = () => this.getMappedAssetByIdentifier(identifier);
      const asset = await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAsset,
        1800,
      );
      return asset
        ? new CollectionType({ items: [asset], count: asset ? 1 : 0 })
        : null;
    } catch (error) {
      this.logger.error('An error occurred while get asset by identifier', {
        path: 'AssetsService.getAsset',
        identifier,
        exception: error,
      });
    }
  }

  async getMappedAssetByIdentifier(identifier: string): Promise<Asset> {
    const nft = await this.apiService.getNftByIdentifier(identifier);
    return Asset.fromNft(nft);
  }

  async getAssetsForIdentifiers(identifiers: string[]): Promise<Asset[]> {
    const nfts = await this.apiService.getNftsByIdentifiers(identifiers);
    return nfts?.map((nft) => Asset.fromNft(nft));
  }

  async addBurnQuantity(
    ownerAddress: string,
    args: HandleQuantityArgs,
    functionName: string,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      args.identifier,
    );
    const contract = getSmartContract(args.addOrBurnRoleAddress);
    const transaction = contract.call({
      func: new ContractFunction(functionName),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
        new U64Value(new BigNumber(args.quantity)),
      ],
      gasLimit: new GasLimit(gas.addBurnQuantity),
    });
    let response = transaction.toPlainObject(new Address(ownerAddress));

    return {
      ...response,
      chainID: elrondConfig.chainID,
    };
  }

  async createNft(
    ownerAddress: string,
    args: CreateNftArgs,
  ): Promise<TransactionNode> {
    const fileData = await this.pinataService.uploadFile(args.file);
    const fileMetadata = new FileContent({
      description: args.attributes.description,
    });
    const assetMetadata = await this.pinataService.uploadText(fileMetadata);

    await this.s3Service.upload(args.file, fileData.hash);
    await this.s3Service.uploadText(fileMetadata, assetMetadata.hash);

    const attributes = `tags:${args.attributes.tags};metadata:${assetMetadata.hash}`;

    const contract = getSmartContract(ownerAddress);
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTCreate'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.collection),
        new U64Value(new BigNumber(args.quantity)),
        BytesValue.fromUTF8(args.name),
        BytesValue.fromHex(nominateVal(parseFloat(args.royalties))),
        BytesValue.fromUTF8(fileData.hash),
        BytesValue.fromUTF8(attributes),
        BytesValue.fromUTF8(fileData.url),
      ],
      gasLimit: new GasLimit(gas.nftCreate),
    });
    let response = transaction.toPlainObject(new Address(ownerAddress));

    return {
      ...response,
      gasLimit: gas.nftCreate + response.data.length * 1_500,
      chainID: elrondConfig.chainID,
    };
  }

  async transferNft(
    ownerAddress: string,
    transferNftArgs: TransferNftArgs,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      transferNftArgs.identifier,
    );
    const contract = getSmartContract(ownerAddress);
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
        new U64Value(new BigNumber(transferNftArgs.quantity)),
        new AddressValue(new Address(transferNftArgs.destinationAddress)),
      ],
      gasLimit: new GasLimit(gas.nftTransfer),
    });
    let response = transaction.toPlainObject(new Address(ownerAddress));
    response.gasLimit = Math.max(
      750_000 + response.data.length * 1_500,
      gas.nftTransfer,
    );
    return {
      ...response,
      chainID: elrondConfig.chainID,
    };
  }

  private async getCollectionAssets(
    query: string = '',
  ): Promise<[any[], string]> {
    const [nfts, count] = await Promise.all([
      this.apiService.getAllNfts(`${query}&fields=media,identifier`),
      this.apiService.getNftsCount(query),
    ]);
    return [nfts, count];
  }

  private async getAllAssets(
    query: string = '',
  ): Promise<CollectionType<Asset>> {
    const [nfts, count] = await Promise.all([
      this.apiService.getAllNfts(query),
      this.apiService.getNftsCount(query),
    ]);
    if (!nfts || !count) {
      return null;
    }

    const assets = nfts?.map((element) => Asset.fromNft(element));
    return new CollectionType({ count, items: assets });
  }

  private async getAssetsWithoutOwner(
    filters: AssetsFilter,
    query: string = '',
  ): Promise<CollectionType<Asset>> {
    if (filters?.identifier) {
      return await this.getAsset(filters?.identifier);
    } else {
      return await this.getOrSetAssets(query);
    }
  }

  private async getOrSetAssets(query: string): Promise<CollectionType<Asset>> {
    try {
      const cacheKey = this.getAssetsQueryCacheKey(query);
      const getAssets = () => this.getAllAssets(query);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAssets,
        30,
      );
    } catch (error) {
      this.logger.error('An error occurred while get assets', {
        path: 'AssetsService.getAssets',
        query,
        exception: error,
      });
    }
  }

  private async getAssetsByOwnerAddress(
    filters: AssetsFilter,
    query: string = '',
  ): Promise<CollectionType<Asset>> {
    if (filters?.identifier) {
      const asset = await this.getAssetByIdentifierAndAddress(
        filters.ownerAddress,
        filters.identifier,
      );
      return asset
        ? new CollectionType({ count: asset ? 1 : 0, items: [asset] })
        : null;
    } else {
      return await this.getAssetsForUser(filters.ownerAddress, query);
    }
  }

  private async getlikedByAssets(
    likedByAddress: string,
    limit: number,
    offset: number,
  ): Promise<CollectionType<Asset>> {
    const [assetsLiked, assetsCount] =
      await this.assetsLikedService.getAssetLiked(
        limit,
        offset,
        likedByAddress,
      );
    const assets = await this.getAssetsForIdentifiers(
      assetsLiked?.map((e) => e.identifier),
    );

    return new CollectionType({ items: assets, count: assetsCount });
  }

  private getAssetsCacheKey(identifier: string) {
    return generateCacheKeyFromParams('asset', identifier);
  }

  private getAssetsQueryCacheKey(request: any) {
    return generateCacheKeyFromParams('assets', hash(request));
  }
}
