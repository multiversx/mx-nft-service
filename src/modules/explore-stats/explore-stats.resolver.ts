import { Query, Resolver } from '@nestjs/graphql';
import { ExploreStatsService } from './explore-stats.service';
import { ExploreStats } from './models/Explore-Stats.dto';

@Resolver(() => ExploreStats)
export class ExploreStatsResolver {
  constructor(private exploreStatsService: ExploreStatsService) {}

  @Query(() => ExploreStats)
  async exploreStats(): Promise<ExploreStats> {
    return this.exploreStatsService.getStats();
  }
}
