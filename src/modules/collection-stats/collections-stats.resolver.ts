import {
  Query,
  Resolver,
  Args,
  ResolveField,
  Int,
  Parent,
} from '@nestjs/graphql';
import { CollectionsStatsService } from './collections-stats.service';
import { CollectionStats } from './models';
import { CollectionStatsFilter } from './models/Collection-Stats.Filter';

@Resolver(() => CollectionStats)
export class CollectionsStatsResolver {
  constructor(private collectionsStatsService: CollectionsStatsService) {}

  @Query(() => CollectionStats)
  async collectionStats(
    @Args({ name: 'filters', type: () => CollectionStatsFilter })
    filters: CollectionStatsFilter,
  ): Promise<CollectionStats> {
    const collection = await this.collectionsStatsService.getStats(
      filters.identifier,
      filters.marketplaceKey,
    );
    return CollectionStats.fromEntity(collection, filters?.identifier);
  }

  @ResolveField(() => Int)
  async items(@Parent() stats: CollectionStats) {
    const { identifier } = stats;
    const nftsCount = await this.collectionsStatsService.getItemsCount(
      identifier,
    );
    return nftsCount.value || 0;
  }
}
