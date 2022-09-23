import { Injectable } from '@nestjs/common';
import { ElrondIdentityService } from 'src/common';
import { Account } from '../account-stats/models';
import { CollectionsService } from '../nftCollections/collection.service';
import { ArtistSortingEnum } from './models/Artist-Sorting.enum';
import { ArtistFilters } from './models/Artists.Filter';

@Injectable()
export class ArtistsService {
  constructor(
    private idService: ElrondIdentityService,
    private collectionsService: CollectionsService,
  ) {}

  async getArtists(
    filters: ArtistFilters,
    page: number = 0,
    size: number = 25,
  ): Promise<[Account[], number]> {
    if (filters.sorting === ArtistSortingEnum.MostFollowed)
      return await this.getMostFollowed(page, size);
    if (filters.sorting === ArtistSortingEnum.MostActive)
      return await this.getMostActive(page, size);
    return await this.getTrending(page, size);
  }

  async getMostFollowed(
    page: number = 0,
    size: number = 25,
  ): Promise<[Account[], number]> {
    const accounts = await this.idService.getMostFollowed(1);
    return [accounts?.map((account) => Account.fromEntity(account)), 1000];
  }

  async getMostActive(
    page: number = 0,
    size: number = 25,
  ): Promise<[Account[], number]> {
    const [collections] = await this.collectionsService.getFullCollections();
    let grouped = collections
      .groupBy((x) => x.artistAddress, true)
      .map((group) => ({
        artist: group.key,
        nfts: group.values.reduce((sum: any, value: { nftsCount: any }) => {
          return sum + value.nftsCount;
        }, 0),
      }))
      .sortedDescending((x) => x.nfts);

    const count = grouped.length;
    grouped = grouped?.slice(page, page + size);
    const mappedAccounts = await this.idService.getAccountsForAddresses(
      grouped.map((x: { artist: any }) => x.artist),
    );
    return [
      mappedAccounts?.map((account) => Account.fromEntity(account)),
      count,
    ];
  }

  async getTrending(
    page: number = 0,
    size: number = 25,
  ): Promise<[Account[], number]> {
    const [trendingCollections, count] =
      await this.collectionsService.getAllTrendingCollections();

    const trendingCreators = trendingCollections?.slice(page, page + size);
    const mappedAccounts = await this.idService.getAccountsForAddresses(
      trendingCreators.map((x: { artistAddress: any }) => x.artistAddress),
    );
    return [
      mappedAccounts?.map((account) => Account.fromEntity(account)),
      count,
    ];
  }
}
