import { Int, Query, ResolveField } from '@nestjs/graphql';
import { Args, Resolver } from '@nestjs/graphql';
import { AnalyticsGetterService } from './analytics.getter.service';
import { GeneralAnalyticsModel } from './models/general-stats.model';
import { MxToolsService } from 'src/common/services/mx-communication/mx-tools.service';
import { AnalyticsInput } from './models/AnalyticsInput';
import { MxElasticService } from 'src/common';
import { CollectionsGetterService } from '../nftCollections/collections-getter.service';
import { MarketplacesService } from '../marketplaces/marketplaces.service';

@Resolver(() => GeneralAnalyticsModel)
export class StatsResolver {
  constructor(
    private toolsService: MxToolsService, private elasticService: MxElasticService,
    private collectionsService: CollectionsGetterService,
    private marketplacesService: MarketplacesService,) { }

  @Query(() => GeneralAnalyticsModel)
  async analytics(
    @Args('input', { type: () => AnalyticsInput, nullable: true }) input: AnalyticsInput,
  ): Promise<GeneralAnalyticsModel> {
    return await this.toolsService.getNftsStats(input);
  }

  @ResolveField('holders', () => Int)
  async holders() {
    return await this.elasticService.getHoldersCount();
  }

  @ResolveField('collections', () => Int)
  async collections() {
    const [, collections] = await this.collectionsService.getCollections();
    return collections;
  }

  @ResolveField('marketplaces', () => Int)
  async marketplaces() {
    const marketplaces = await this.marketplacesService.getMarketplaces();
    return marketplaces?.count;
  }
}
