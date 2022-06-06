import { Query, Resolver, Args, ResolveField, Parent } from '@nestjs/graphql';
import { SearchResponse } from './models/Search-Response.dto';
import { SearchService } from './search.service';
import { SearchFilter } from './models/Search.Filter';

@Resolver(() => SearchResponse)
export class SearchResolver {
  constructor(private accountsStatsService: SearchService) {}

  @Query(() => SearchResponse)
  async search(
    @Args({ name: 'filters', type: () => SearchFilter })
    filters,
  ): Promise<SearchResponse> {
    return new SearchResponse({ searchTerm: filters.searchTerm });
  }

  @ResolveField(() => [String])
  async collections(@Parent() stats: SearchResponse) {
    const { searchTerm } = stats;
    const collection = await this.accountsStatsService.getCollections(
      searchTerm,
    );
    return collection;
  }

  @ResolveField(() => [String])
  async accounts(@Parent() stats: SearchResponse) {
    const { searchTerm } = stats;
    const account = await this.accountsStatsService.getHerotags(searchTerm);
    return account;
  }

  @ResolveField(() => [String])
  async nfts(@Parent() stats: SearchResponse) {
    const { searchTerm } = stats;
    const nfts = await this.accountsStatsService.getNfts(searchTerm);
    return nfts;
  }

  @ResolveField(() => [String])
  async tags(@Parent() search: SearchResponse) {
    const { searchTerm } = search;
    const tags = await this.accountsStatsService.getTags(searchTerm);
    return tags;
  }
}
