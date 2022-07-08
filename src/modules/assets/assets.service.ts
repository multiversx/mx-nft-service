import {
  Address,
  AddressValue,
  BytesValue,
  ContractFunction,
  TokenPayment,
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
import { Asset, CollectionType } from './models';
import BigNumber from 'bignumber.js';
import * as Redis from 'ioredis';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AssetScamInfoProvider } from './loaders/assets-scam-info.loader';
import { AssetsSupplyLoader } from './loaders/assets-supply.loader';
import { AssetsFilter } from '../common/filters/filtersTypes';
import { TransactionNode } from '../common/transaction';
import { TimeConstants } from 'src/utils/time-utils';
import {
  UpdateQuantityRequest,
  CreateNftRequest,
  TransferNftRequest,
} from './models/requests';
import { AssetRarityInfoProvider } from './loaders/assets-rarity-info.loader';
const hash = require('object-hash');

@Injectable()
export class AssetsService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
    private pinataService: PinataService,
    private assetScamLoader: AssetScamInfoProvider,
    private assetRarityLoader: AssetRarityInfoProvider,
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
    countQuery: string = '',
  ): Promise<CollectionType<Asset>> {
    const [nfts, count] = await Promise.all([
      this.apiService.getNftsForUser(
        address,
        query + '&includeFlagged=true&source=elastic',
      ),
      this.apiService.getNftsForUserCount(
        address,
        countQuery + '&includeFlagged=true',
      ),
    ]);
    const assets = nfts?.map((element) => Asset.fromNft(element));
    return new CollectionType({ count, items: assets });
  }

  async getAssets(
    offset: number = 0,
    limit: number = 10,
    filters: AssetsFilter,
  ): Promise<CollectionType<Asset>> {
    const apiQuery = filters?.ownerAddress
      ? this.getApiQueryWithoutOwnerFlag(filters, offset, limit)
      : this.getApiQuery(filters, offset, limit);
    const apiCountQuery = this.getApiQueryForCount(filters);

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
      const response = await this.getAssetsByOwnerAddress(
        filters,
        apiQuery,
        apiCountQuery,
      );
      await this.addToCache(response);
      return new CollectionType({
        count: response?.count,
        items: response?.items?.map((a) => {
          return { ...a, ownerAddress: filters?.ownerAddress };
        }),
      });
    }

    const response = await this.getAssetsWithoutOwner(
      filters,
      apiQuery,
      apiCountQuery,
    );
    this.addToCache(response);
    return response;
  }

  private getApiQuery(filters: AssetsFilter, offset: number, limit: number) {
    return new AssetsQuery()
      .addCreator(filters?.creatorAddress)
      .addTags(filters?.tags)
      .addIdentifiers(filters?.identifiers)
      .addCollection(filters?.collection)
      .addType(filters?.type)
      .withOwner()
      .withSupply()
      .addPageSize(offset, limit)
      .build();
  }

  private getApiQueryWithoutOwnerFlag(
    filters: AssetsFilter,
    offset: number,
    limit: number,
  ) {
    return new AssetsQuery()
      .addCreator(filters?.creatorAddress)
      .addTags(filters?.tags)
      .addIdentifiers(filters?.identifiers)
      .addCollection(filters?.collection)
      .addType(filters?.type)
      .withSupply()
      .addPageSize(offset, limit)
      .build();
  }

  private getApiQueryForCount(filters: AssetsFilter) {
    return new AssetsQuery()
      .addCreator(filters?.creatorAddress)
      .addTags(filters?.tags)
      .addIdentifiers(filters?.identifiers)
      .addCollection(filters?.collection)
      .addType(filters?.type)
      .build();
  }

  private async addToCache(response: CollectionType<Asset>) {
    if (response?.count && response?.items) {
      let assetsWithRarity = response.items?.filter((x) => x?.rarity);
      await this.assetRarityLoader.batchRarity(
        assetsWithRarity?.map((a) => a.identifier),
        assetsWithRarity?.groupBy((asset) => asset.identifier),
      );
      let assetsWithScamInfo = response.items?.filter((x) => x?.scamInfo);
      await this.assetScamLoader.batchScamInfo(
        assetsWithScamInfo?.map((a) => a.identifier),
        assetsWithScamInfo?.groupBy((asset) => asset.identifier),
      );

      let assetsWithSupply = response.items?.filter((x) => x?.supply);
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
      const asset = await this.redisCacheService.getOrSetWithDifferentTtl(
        this.redisClient,
        cacheKey,
        getAsset,
      );
      return asset?.value
        ? new CollectionType({ items: [asset.value], count: asset ? 1 : 0 })
        : null;
    } catch (error) {
      this.logger.error('An error occurred while get asset by identifier', {
        path: 'AssetsService.getAsset',
        identifier,
        exception: error,
      });
    }
  }

  async getMappedAssetByIdentifier(
    identifier: string,
  ): Promise<{ key: string; value: Asset; ttl: number }> {
    const nft = await this.apiService.getNftByIdentifier(identifier);
    let ttl = TimeConstants.oneDay;
    if (!nft) {
      ttl = 3 * TimeConstants.oneSecond;
    }
    if (nft?.media && nft?.media[0].thumbnailUrl.includes('default'))
      ttl = TimeConstants.oneMinute;
    return {
      key: identifier,
      value: Asset.fromNft(nft),
      ttl: ttl,
    };
  }

  async getAssetsForIdentifiers(identifiers: string[]): Promise<Asset[]> {
    const nfts = await this.apiService.getNftsByIdentifiers(identifiers);
    return nfts?.map((nft) => Asset.fromNft(nft));
  }

  async updateQuantity(
    ownerAddress: string,
    request: UpdateQuantityRequest,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      request.identifier,
    );
    const contract = getSmartContract(request.updateQuantityRoleAddress);
    const transaction = contract.call({
      func: new ContractFunction(request.functionName),
      value: TokenPayment.egldFromAmount(0),
      args: [
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
        new U64Value(new BigNumber(request.quantity)),
      ],
      gasLimit: gas.addBurnQuantity,
      chainID: elrondConfig.chainID,
    });
    return transaction.toPlainObject(new Address(ownerAddress));
  }

  async createNft(
    ownerAddress: string,
    request: CreateNftRequest,
  ): Promise<TransactionNode> {
    const file = await request.file;
    const fileData = await this.pinataService.uploadFile(file);
    const fileMetadata = new FileContent({
      description: request.attributes.description,
    });
    const assetMetadata = await this.pinataService.uploadText(fileMetadata);

    await this.s3Service.upload(file, fileData.hash);
    await this.s3Service.uploadText(fileMetadata, assetMetadata.hash);

    const attributes = `tags:${request.attributes.tags};metadata:${assetMetadata.hash}`;

    const contract = getSmartContract(ownerAddress);
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTCreate'),
      value: TokenPayment.egldFromAmount(0),
      args: [
        BytesValue.fromUTF8(request.collection),
        new U64Value(new BigNumber(request.quantity)),
        BytesValue.fromUTF8(request.name),
        BytesValue.fromHex(nominateVal(parseFloat(request.royalties))),
        BytesValue.fromUTF8(fileData.hash),
        BytesValue.fromUTF8(attributes),
        BytesValue.fromUTF8(fileData.url),
      ],
      gasLimit: gas.nftCreate,
      chainID: elrondConfig.chainID,
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
    transferRequest: TransferNftRequest,
  ): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(
      transferRequest.identifier,
    );
    const contract = getSmartContract(ownerAddress);
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: TokenPayment.egldFromAmount(0),
      args: [
        BytesValue.fromUTF8(collection),
        BytesValue.fromHex(nonce),
        new U64Value(new BigNumber(transferRequest.quantity)),
        new AddressValue(new Address(transferRequest.destinationAddress)),
      ],
      gasLimit: gas.nftTransfer,
      chainID: elrondConfig.chainID,
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
      this.apiService.getAllNfts(
        new AssetsQuery()
          .addQuery(query)
          .addFields(['media', 'identifier'])
          .build(),
      ),
      this.apiService.getNftsCount(query),
    ]);
    return [nfts, count];
  }

  private async getAllAssets(
    query: string = '',
    countQuery: string = '',
  ): Promise<CollectionType<Asset>> {
    const [nfts, count] = await Promise.all([
      this.apiService.getAllNfts(
        new AssetsQuery().addQuery(query).build(),
      ),
      this.apiService.getNftsCount(countQuery),
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
    countQuery: string = '',
  ): Promise<CollectionType<Asset>> {
    if (filters?.identifier) {
      return await this.getAsset(filters?.identifier);
    } else {
      return await this.getOrSetAssets(query, countQuery);
    }
  }

  private async getOrSetAssets(
    query: string,
    countQuery: string = '',
  ): Promise<CollectionType<Asset>> {
    try {
      const cacheKey = this.getAssetsQueryCacheKey(query);
      const getAssets = () => this.getAllAssets(query, countQuery);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAssets,
        5 * TimeConstants.oneSecond,
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
    countQuery: string = '',
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
      return await this.getAssetsForUser(
        filters.ownerAddress,
        query,
        countQuery,
      );
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
