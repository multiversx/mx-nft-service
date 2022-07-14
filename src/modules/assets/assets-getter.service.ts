import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import '../../utils/extentions';
import { AssetsLikesService } from './assets-likes.service';
import { AssetsQuery } from '.';
import { Asset, CollectionType } from './models';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AssetScamInfoProvider } from './loaders/assets-scam-info.loader';
import { AssetsSupplyLoader } from './loaders/assets-supply.loader';
import { AssetsFilter } from '../common/filters/filtersTypes';
import { TimeConstants } from 'src/utils/time-utils';
import { AssetRarityInfoProvider } from './loaders/assets-rarity-info.loader';
const hash = require('object-hash');

@Injectable()
export class AssetsGetterService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
    private assetScamLoader: AssetScamInfoProvider,
    private assetRarityLoader: AssetRarityInfoProvider,
    private assetSupplyLoader: AssetsSupplyLoader,
    private assetsLikedService: AssetsLikesService,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getAssetsForUser(
    address: string,
    query: string = '',
    countQuery: string = '',
  ): Promise<CollectionType<Asset>> {
    query = new AssetsQuery(query)
      .addQuery('includeFlagged=true&source=elastic')
      .build();
    countQuery = new AssetsQuery(countQuery)
      .addQuery('includeFlagged=true')
      .build();
    const [nfts, count] = await Promise.all([
      this.apiService.getNftsForUser(address, query),
      this.apiService.getNftsForUserCount(address, countQuery),
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

  public async getAsset(identifier: string): Promise<Asset> {
    try {
      const cacheKey = this.getAssetsCacheKey(identifier);
      const getAsset = () => this.getMappedAssetByIdentifier(identifier);
      const asset = await this.redisCacheService.getOrSetWithDifferentTtl(
        this.redisClient,
        cacheKey,
        getAsset,
      );
      return asset?.value ? asset?.value : null;
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

  private async getCollectionAssets(
    query: string = '',
  ): Promise<[any[], string]> {
    query = new AssetsQuery(query).addFields(['media', 'identifier']).build();
    const [nfts, count] = await Promise.all([
      this.apiService.getAllNfts(query),
      this.apiService.getNftsCount(query),
    ]);
    return [nfts, count];
  }

  private async getAllAssets(
    query: string = '',
    countQuery: string = '',
  ): Promise<CollectionType<Asset>> {
    query = new AssetsQuery(query).build();
    countQuery = new AssetsQuery(countQuery).build();
    const [nfts, count] = await Promise.all([
      this.apiService.getAllNfts(query),
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
      const asset = await this.getAsset(filters?.identifier);
      return asset
        ? new CollectionType({ items: [asset], count: asset ? 1 : 0 })
        : null;
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

  private getAssetsCacheKey(identifier: string) {
    return generateCacheKeyFromParams('asset', identifier);
  }

  private getAssetsQueryCacheKey(request: any) {
    return generateCacheKeyFromParams('assets', hash(request));
  }
}
