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
import { cacheConfig, gas } from 'src/config';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import '../../utils/extentions';
import { AssetsFilter } from '../filtersTypes';
import { nominateStringVal, nominateVal } from '../formatters';
import { FileContent } from '../ipfs/file.content';
import { PinataService } from '../ipfs/pinata.service';
import { S3Service } from '../s3/s3.service';
import { TransactionNode } from '../transaction';
import { AssetsLikesService } from './assets-likes.service';
import { AssetsQuery } from '.';
import {
  CreateNftArgs,
  TransferNftArgs,
  Asset,
  HandleQuantityArgs,
} from './models';
import BigNumber from 'bignumber.js';
import * as Redis from 'ioredis';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
const hash = require('object-hash');

@Injectable()
export class AssetsService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
    private pinataService: PinataService,
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
  ): Promise<[Asset[], number]> {
    const [nfts, count] = await Promise.all([
      this.apiService.getNftsForUser(address, query + '&withMetadata=true'),
      this.apiService.getNftsForUserCount(address, query),
    ]);
    const assets = nfts?.map((element) => Asset.fromNft(element));
    return [assets, count];
  }

  async getAssets(
    offset: number = 0,
    limit: number = 10,
    filters: AssetsFilter,
  ): Promise<[Asset[], number]> {
    const apiQuery = new AssetsQuery()
      .addCreator(filters?.creatorAddress)
      .addTags(filters?.tags)
      .addIdentifiers(filters?.identifiers)
      .addCollection(filters?.collection)
      .addType(filters?.type)
      .addPageSize(offset, limit)
      .build();

    if (filters?.likedByAddress) {
      return await this.getlikedByAssets(filters.likedByAddress, limit, offset);
    }
    if (filters?.ownerAddress) {
      const [assets, count] = await this.getAssetsByOwnerAddress(
        filters,
        apiQuery,
      );
      return [
        assets?.map((a) => {
          return { ...a, ownerAddress: filters?.ownerAddress };
        }),
        count,
      ];
    }

    return await this.getAssetsWithoutOwner(filters, apiQuery);
  }

  async getAssetsForCollection(
    filters: AssetsFilter,
  ): Promise<[any[], string]> {
    const apiQuery = new AssetsQuery()
      .addCollection(filters?.collection)
      .addPageSize(0, 4)
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

  private async getAsset(identifier): Promise<[Asset[], number]> {
    try {
      const cacheKey = this.getAssetsCacheKey(identifier);
      const getAsset = () => this.getMappedAssetByIdentifier(identifier);
      const asset = await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAsset,
        cacheConfig.followersttl,
      );
      return [[asset], asset ? 1 : 0];
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

  async addQuantity(
    ownerAddress: string,
    args: HandleQuantityArgs,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      args.identifier,
    );
    const contract = getSmartContract(args.addOrBurnRoleAddress);
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTAddQuantity'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
        new U64Value(new BigNumber(args.quantity)),
      ],
      gasLimit: new GasLimit(gas.addQuantity),
    });

    return transaction.toPlainObject(new Address(ownerAddress));
  }

  async burnQuantity(
    ownerAddress: string,
    args: HandleQuantityArgs,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      args.identifier,
    );
    const contract = getSmartContract(args.addOrBurnRoleAddress);
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTBurn'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
        BytesValue.fromHex(nominateStringVal(args.quantity)),
      ],
      gasLimit: new GasLimit(gas.burnQuantity),
    });

    return transaction.toPlainObject(new Address(ownerAddress));
  }

  async createNft(
    ownerAddress: string,
    args: CreateNftArgs,
  ): Promise<TransactionNode> {
    const fileData = await this.pinataService.uploadFile(args.file);
    const fileMetadata = new FileContent({
      description: args.attributes.description,
      fileType: args.file.mimetype,
      fileUri: fileData.url,
      fileName: args.file.filename,
    });
    const asset = await this.pinataService.uploadText(fileMetadata);

    await this.s3Service.upload(args.file, fileData.hash);
    await this.s3Service.uploadText(fileMetadata, asset.hash);

    const attributes = `tags:${args.attributes.tags};metadata:${asset.hash}`;

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

    return transaction.toPlainObject();
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

    return transaction.toPlainObject(new Address(ownerAddress));
  }

  private async getCollectionAssets(
    query: string = '',
  ): Promise<[any[], string]> {
    const [nfts, count] = await Promise.all([
      this.apiService.getAllNfts(`${query}&fields=thumbnailUrl,identifier`),
      this.apiService.getNftsCount(query),
    ]);
    return [nfts, count];
  }

  private async getAllAssets(
    query: string = '',
  ): Promise<[Asset[], number] | any> {
    const [nfts, count] = await Promise.all([
      this.apiService.getAllNfts(query),
      this.apiService.getNftsCount(query),
    ]);
    if (!nfts || !count) {
      return;
    }

    const assets = nfts?.map((element) => Asset.fromNft(element));
    return [assets, count];
  }

  private async getAssetsWithoutOwner(
    filters: AssetsFilter,
    query: string = '',
  ): Promise<[Asset[], number]> {
    if (filters?.identifier) {
      return await this.getAsset(filters?.identifier);
    } else {
      return await this.getOrSetAssets(query);
    }
  }

  private async getOrSetAssets(query: string): Promise<[Asset[], number]> {
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
  ): Promise<[Asset[], number]> {
    if (filters?.identifier) {
      const asset = await this.getAssetByIdentifierAndAddress(
        filters.ownerAddress,
        filters.identifier,
      );
      return [[asset], asset ? 1 : 0];
    } else {
      return await this.getAssetsForUser(filters.ownerAddress, query);
    }
  }

  private async getlikedByAssets(
    likedByAddress: string,
    limit: number,
    offset: number,
  ): Promise<[Asset[], number]> {
    const [assetsLiked, assetsCount] =
      await this.assetsLikedService.getAssetLiked(
        limit,
        offset,
        likedByAddress,
      );
    const assets = await this.getAssetsForIdentifiers(
      assetsLiked?.map((e) => e.identifier),
    );

    return [assets, assetsCount];
  }

  private getAssetsCacheKey(identifier: string) {
    return generateCacheKeyFromParams('asset', identifier);
  }

  private getAssetsQueryCacheKey(request: any) {
    return generateCacheKeyFromParams('assets', hash(request));
  }
}
