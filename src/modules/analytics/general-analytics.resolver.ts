import { Int, Query, ResolveField } from '@nestjs/graphql';
import { Args, Resolver } from '@nestjs/graphql';
import { GeneralAnalyticsModel } from './models/general-stats.model';
import { AnalyticsInput } from './models/analytics-input.model';
import { GeneralAnalyticsService } from './general-analytics.service';
import { AnalyticsAggregateValue } from './models/analytics-aggregate-value';

@Resolver(() => GeneralAnalyticsModel)
export class GeneralAnalyticsResolver {
  constructor(private generalAnalyticsService: GeneralAnalyticsService) {}

  @Query(() => GeneralAnalyticsModel)
  async generalAnalytics(
    @Args('input', { type: () => AnalyticsInput, nullable: true })
    input: AnalyticsInput,
  ): Promise<GeneralAnalyticsModel> {
    return new GeneralAnalyticsModel();
  }

  @ResolveField('listing', () => [AnalyticsAggregateValue])
  async listing(@Args('input', { type: () => AnalyticsInput }) input: AnalyticsInput) {
    return await this.generalAnalyticsService.getActiveNftsStats(input);
  }

  @ResolveField('volume', () => [AnalyticsAggregateValue])
  async volume(@Args('input', { type: () => AnalyticsInput }) input: AnalyticsInput) {
    return await this.generalAnalyticsService.getLast24HActive(input);
  }

  @ResolveField('nfts', () => [AnalyticsAggregateValue])
  async nfts(@Args('input', { type: () => AnalyticsInput }) input: AnalyticsInput) {
    return await this.generalAnalyticsService.getNftsCount(input);
  }

  @ResolveField('holders', () => Int)
  async holders() {
    return await this.generalAnalyticsService.getHolders();
  }

  @ResolveField('collections', () => Int)
  async collections() {
    return await this.generalAnalyticsService.getCollections();
  }

  @ResolveField('marketplaces', () => Int)
  async marketplaces() {
    return await this.generalAnalyticsService.getMarketplaces();
  }
}
