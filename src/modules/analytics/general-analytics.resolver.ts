import { Int, Query, ResolveField } from '@nestjs/graphql';
import { Args, Resolver } from '@nestjs/graphql';
import { GeneralAnalyticsModel } from './models/general-stats.model';
import { AnalyticsInput } from './models/AnalyticsInput';
import { GeneralAnalyticsService } from './general-analytics.service';
import { AggregateValue } from './models/aggregate-value';

@Resolver(() => GeneralAnalyticsModel)
export class GeneralAnalyticsResolver {
  constructor(
    private generalAnalyticsService: GeneralAnalyticsService) { }

  @Query(() => GeneralAnalyticsModel)
  async generalAnalytics(
    @Args('input', { type: () => AnalyticsInput, nullable: true }) input: AnalyticsInput,
  ): Promise<GeneralAnalyticsModel> {
    return new GeneralAnalyticsModel();
  }

  @ResolveField('listing', () => [AggregateValue])
  async listing(@Args('input', { type: () => AnalyticsInput }) input: AnalyticsInput,) {
    return await this.generalAnalyticsService.getActiveNftsStats(input);
  }

  @ResolveField('volume', () => [AggregateValue])
  async volume(@Args('input', { type: () => AnalyticsInput }) input: AnalyticsInput,) {
    return await this.generalAnalyticsService.getLast24HActive(input);
  }

  @ResolveField('nfts', () => [AggregateValue])
  async nfts(@Args('input', { type: () => AnalyticsInput }) input: AnalyticsInput,) {
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
