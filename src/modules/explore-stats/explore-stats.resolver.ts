import { Query, Resolver } from '@nestjs/graphql';
import { ExploreStatsService } from './explore-stats.service';
import { ExploreCollectionsStats, ExploreNftsStats, ExploreStats } from './models/Explore-Stats.dto';

@Resolver(() => ExploreStats)
export class ExploreStatsResolver {
  constructor(private exploreStatsService: ExploreStatsService) {}

  @Query(() => ExploreStats)
  async exploreStats(): Promise<ExploreStats> {
    return this.exploreStatsService.getExploreStats();
  }

  @Query(() => ExploreNftsStats)
  async exploreNftsStats(): Promise<ExploreNftsStats> {
    return this.exploreStatsService.getExploreNftsStats();
  }

  @Query(() => ExploreCollectionsStats)
  async exploreCollectionsStats(): Promise<ExploreCollectionsStats> {
    return this.exploreStatsService.getExploreCollectionsStats();
  }
}
