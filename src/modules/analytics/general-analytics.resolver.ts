import { Int, Query, ResolveField } from '@nestjs/graphql';
import { Args, Resolver } from '@nestjs/graphql';
import { GeneralAnalyticsModel } from './models/general-stats.model';
import { AnalyticsInput } from './models/AnalyticsInput';
import { GeneralAnalyticsService } from './general-analytics.service';

@Resolver(() => GeneralAnalyticsModel)
export class GeneralAnalyticsResolver {
  constructor(
    private generalAnalyticsService: GeneralAnalyticsService) { }

  @Query(() => GeneralAnalyticsModel)
  async generalAnalytics(
    @Args('input', { type: () => AnalyticsInput, nullable: true }) input: AnalyticsInput,
  ): Promise<GeneralAnalyticsModel> {
    return await this.generalAnalyticsService.getAnalyticsFromDataApi(input);
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
