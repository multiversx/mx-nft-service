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
    return new SearchResponse({ serchTerm: filters.searchTerm });
  }

  @ResolveField(() => [String])
  async collections(@Parent() stats: SearchResponse) {
    const { serchTerm } = stats;
    const collection = await this.accountsStatsService.getCollections(
      serchTerm,
    );
    return collection;
  }

  @ResolveField(() => [String])
  async accounts(@Parent() stats: SearchResponse) {
    const { serchTerm } = stats;
    const account = await this.accountsStatsService.getHerotags(serchTerm);
    return account;
  }

  @ResolveField(() => [String])
  async nfts(@Parent() stats: SearchResponse) {
    const { serchTerm } = stats;
    const nfts = await this.accountsStatsService.getNfts(serchTerm);
    return nfts;
  }
}
