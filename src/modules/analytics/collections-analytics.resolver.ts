import { Int, Parent, Query, ResolveField } from '@nestjs/graphql';
import { Args, Resolver } from '@nestjs/graphql';
import { AnalyticsInput } from './models/AnalyticsInput';
import { AggregateValue } from './models/aggregate-value';
import { CollectionsAnalyticsService } from './collections-analytics.service';
import { CollectionsAnalyticsModel } from './models/collections-stats.model';
import { BaseResolver } from '../common/base.resolver';
import { CollectionsAnalyticsResponse } from './models/CollectionsAnalyticsResonse';
import PageResponse from '../common/PageResponse';
import ConnectionArgs from '../common/filters/ConnectionArgs';

@Resolver(() => CollectionsAnalyticsModel)
export class CollectionsAnalyticsResolver extends BaseResolver(CollectionsAnalyticsModel) {
  constructor(
    private generalAnalyticsService: CollectionsAnalyticsService) {
    super();
  }

  @Query(() => CollectionsAnalyticsResponse)
  async generalAnalytics(
    @Args({ name: 'filters', type: () => AnalyticsInput, nullable: true })
    filters: AnalyticsInput,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<CollectionsAnalyticsResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [collections, count] = await this.generalAnalyticsService.getCollections(limit, offset,)
    return PageResponse.mapResponse<CollectionsAnalyticsModel>(
      collections || [],
      pagination,
      count || 0,
      0,
      limit,
    );
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
  async holders(@Parent() collection: CollectionsAnalyticsModel) {
    return await this.generalAnalyticsService.getHolders(collection.collectionIdentifier);
  }

  @ResolveField('floorPrice', () => Int)
  async floorPrice(@Parent() collection: CollectionsAnalyticsModel) {
    return this.generalAnalyticsService.getCollectionFloorPrice(collection.collectionIdentifier);
  }

  @ResolveField('volume24h', () => [AggregateValue])
  async volume24h(@Parent() collection: CollectionsAnalyticsModel) {
    return await this.generalAnalyticsService.get(collection.collectionIdentifier);

  }
}
