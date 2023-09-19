import { Int, Parent, Query, ResolveField } from '@nestjs/graphql';
import { Args, Resolver } from '@nestjs/graphql';
import { CollectionsAnalyticsService } from './collections-analytics.service';
import { CollectionsAnalyticsModel } from './models/collections-stats.model';
import { BaseResolver } from '../common/base.resolver';
import { CollectionsAnalyticsResponse } from './models/collections-analytics.response';
import PageResponse from '../common/PageResponse';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import { CollectionDetailsProvider } from './loaders/collection-details.loader';
import { CollectionsDetailsModel } from './models/collections-details.model';
import { AnalyticsArgs, CollectionAnalyticsArgs } from './models/analytics-args.model';
import { AnalyticsAggregateValue } from './models/analytics-aggregate-value';
import { HoldersCount } from './models/general-stats.model';

@Resolver(() => CollectionsAnalyticsModel)
export class CollectionsAnalyticsResolver extends BaseResolver(CollectionsAnalyticsModel) {
  constructor(private generalAnalyticsService: CollectionsAnalyticsService, private collectionsLoader: CollectionDetailsProvider) {
    super();
  }

  @Query(() => CollectionsAnalyticsResponse)
  async collectionsAnalytics(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
    @Args('input', { type: () => CollectionAnalyticsArgs, nullable: true })
    input: CollectionAnalyticsArgs,
  ): Promise<CollectionsAnalyticsResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [collections, count] = await this.generalAnalyticsService.getCollectionsOrderByVolum(limit, offset, input.series);
    return PageResponse.mapResponse<CollectionsAnalyticsModel>(collections || [], pagination, count || 0, 0, limit);
  }

  @ResolveField('holders', () => Int)
  async holders(@Parent() collection: CollectionsAnalyticsModel) {
    return await this.generalAnalyticsService.getHolders(collection.collectionIdentifier);
  }

  @ResolveField('floorPrice', () => Int)
  async floorPrice(@Parent() collection: CollectionsAnalyticsModel) {
    return this.generalAnalyticsService.getCollectionFloorPrice(collection.collectionIdentifier);
  }

  @ResolveField('details', () => CollectionsDetailsModel)
  async details(@Parent() collection: CollectionsAnalyticsModel) {
    const collectionDetails = await this.collectionsLoader.load(collection.collectionIdentifier);
    return collectionDetails?.value ?? null;
  }

  @ResolveField('volumeData', () => [AnalyticsAggregateValue])
  async volumeData(
    @Args('input', { type: () => AnalyticsArgs, nullable: true })
    input: AnalyticsArgs,
    @Parent() collection: CollectionsAnalyticsModel,
  ) {
    return await this.generalAnalyticsService.getVolumeForTimePeriod(input.time, collection.collectionIdentifier, input.metric);
  }

  @ResolveField('floorPriceData', () => [AnalyticsAggregateValue])
  async floorPriceData(
    @Args('input', { type: () => AnalyticsArgs, nullable: true })
    input: AnalyticsArgs,
    @Parent() collection: CollectionsAnalyticsModel,
  ) {
    return await this.generalAnalyticsService.getFloorPriceVolumeForTimePeriod(input.time, collection.collectionIdentifier, input.metric);
  }

  @ResolveField('topHolders', () => [HoldersCount])
  async topHolders(@Parent() collection: CollectionsAnalyticsModel) {
    return await this.generalAnalyticsService.getTopHolders(collection.collectionIdentifier);
  }
}
