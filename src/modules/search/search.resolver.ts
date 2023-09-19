import { Query, Resolver, Args, ResolveField, Parent } from '@nestjs/graphql';
import { SearchResponse } from './models/Search-Response.dto';
import { SearchService } from './search.service';
import { SearchFilter } from './models/Search.Filter';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { isValidAddress } from 'src/utils/helpers';
import { SearchNftCollectionResponse, SearchItemResponse } from './models/SearchItemResponse';

@Resolver(() => SearchResponse)
export class SearchResolver {
  constructor(private searchService: SearchService) {}

  @Query(() => SearchResponse)
  @UsePipes(new ValidationPipe())
  async search(@Args('filters', { type: () => SearchFilter }) filters: SearchFilter): Promise<SearchResponse> {
    return new SearchResponse({ searchTerm: filters.searchTerm });
  }

  @ResolveField(() => [SearchNftCollectionResponse])
  async collections(@Parent() stats: SearchResponse) {
    const { searchTerm } = stats;
    if (isValidAddress(searchTerm)) {
      return [];
    }
    const collection = await this.searchService.getCollections(searchTerm);
    return collection;
  }

  @ResolveField(() => [SearchItemResponse])
  async accounts(@Parent() stats: SearchResponse) {
    const { searchTerm } = stats;
    if (isValidAddress(searchTerm)) {
      return [await this.searchService.getHerotagForAddress(searchTerm)];
    }
    const account = await this.searchService.getHerotags(searchTerm);
    return account;
  }

  @ResolveField(() => [SearchNftCollectionResponse])
  async nfts(@Parent() stats: SearchResponse) {
    const { searchTerm } = stats;
    if (isValidAddress(searchTerm)) {
      return [];
    }
    const nfts = await this.searchService.getNfts(searchTerm);
    return nfts;
  }

  @ResolveField(() => [SearchItemResponse])
  async tags(@Parent() search: SearchResponse) {
    const { searchTerm } = search;
    if (isValidAddress(searchTerm)) {
      return [];
    }
    const tags = await this.searchService.getTags(searchTerm);
    return tags;
  }
}
