import { Injectable } from '@nestjs/common';
import { MxIdentityService } from 'src/common';
import * as Redis from 'ioredis';
import { CachingService } from 'src/common/services/caching/caching.service';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Account } from '../account-stats/models';
import { ArtistSortingEnum } from './models/Artist-Sorting.enum';
import { ArtistFilters } from './models/Artists.Filter';
import { cacheConfig } from 'src/config';
import { CollectionsGetterService } from '../nftCollections/collections-getter.service';

@Injectable()
export class ArtistsService {
  private redisClient: Redis.Redis;
  constructor(
    private idService: MxIdentityService,
    private cachingService: CachingService,
    private collectionsGetterService: CollectionsGetterService,
  ) {
    this.redisClient = this.cachingService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getArtists(
    filters: ArtistFilters,
    page: number = 0,
    size: number = 25,
  ): Promise<[Account[], number]> {
    if (filters.sorting === ArtistSortingEnum.MostFollowed) {
      return await this.getMostFollowed(page, size);
    }
    if (filters.sorting === ArtistSortingEnum.MostActive) {
      return await this.getMostActive(page, size);
    }
    return await this.getTrending(page, size);
  }

  private async getMostFollowed(
    page: number = 0,
    size: number = 25,
  ): Promise<[Account[], number]> {
    const [collections, count] =
      await this.collectionsGetterService.getOrSetMostFollowedCollections();

    const selectedCollections = collections?.slice(page, page + size);
    const mappedAccounts = await this.getAccountsInfo(
      selectedCollections.map((x: { artist: any }) => x.artist),
    );
    return [
      mappedAccounts?.map((account) => Account.fromEntity(account?.value)),
      count,
    ];
  }

  private async getMostActive(
    page: number = 0,
    size: number = 25,
  ): Promise<[Account[], number]> {
    const [collections, count] =
      await this.collectionsGetterService.getOrSetMostActiveCollections();

    const selectedCollections = collections?.slice(page, page + size);
    const mappedAccounts = await this.getAccountsInfo(
      selectedCollections.map((x: { artist: any }) => x.artist),
    );
    return [
      mappedAccounts?.map((account) => Account.fromEntity(account?.value)),
      count,
    ];
  }

  private async getTrending(
    page: number = 0,
    size: number = 25,
  ): Promise<[Account[], number]> {
    const [trendingCollections, count] =
      await this.collectionsGetterService.getOrSetTrendingCollections();

    const trendingCreators = trendingCollections?.slice(page, page + size);
    const mappedAccounts = await this.getAccountsInfo(
      trendingCreators.map((x: { artistAddress: any }) => x.artistAddress),
    );
    return [
      mappedAccounts?.map((account) => Account.fromEntity(account?.value)),
      count,
    ];
  }

  private async getAccountsInfo(addresses: string[]) {
    const accountsPromises = addresses.map((address) =>
      this.getOrSetAccount(address),
    );
    return await Promise.all(accountsPromises);
  }

  async getOrSetAccount(address: string) {
    return this.cachingService.getOrSetCache(
      this.redisClient,
      `${CacheInfo.Account.key}_${address}`,
      async () => this.getMappedAccountForRedis(address),
      CacheInfo.Account.ttl,
    );
  }

  async getMappedAccountForRedis(address: string) {
    const account = await this.idService.getProfile(address);
    return { key: address, value: account };
  }
}
