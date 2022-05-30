import { Query, Resolver, Args } from '@nestjs/graphql';
import { CollectionsStatsService } from './collections-stats.service';
import { CollectionStats } from './models';
import { CollectionStatsFilter } from './models/Collection-Stats.Filter';

@Resolver(() => CollectionStats)
export class CollectionsStatsResolver {
  constructor(private accountsStatsService: CollectionsStatsService) {}

  @Query(() => CollectionStats)
  async collectionStats(
    @Args({ name: 'filters', type: () => CollectionStatsFilter })
    filters,
  ): Promise<CollectionStats> {
    return CollectionStats.fromEntity(filters?.identifier);
  }

  // @ResolveField(() => Int)
  // async claimable(@Parent() stats: AccountStats) {
  //   const { address } = stats;
  //   const claimableCount = await this.accountsStatsService.getClaimableCount(
  //     address,
  //   );
  //   return claimableCount || 0;
  // }
}
