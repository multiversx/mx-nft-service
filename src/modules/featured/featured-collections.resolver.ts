import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Asset, AssetsResponse } from '../assets/models';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { BaseResolver } from '../common/base.resolver';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { Collection } from '../nftCollections/models';
import CollectionResponse from '../nftCollections/models/CollectionResponse';
import { FeaturedCollectionTypeEnum } from './FeatureCollectionType.enum';
import { FeaturedCollectionsFilter } from './Featured-Collections.Filter';
import { FeaturedService } from './featured.service';

@Resolver(() => Asset)
export class FeaturedCollectionsResolver extends BaseResolver(Collection) {
  constructor(private featuredService: FeaturedService) {
    super();
  }

  @Query(() => CollectionResponse)
  async featuredCollections(
    @Args({
      name: 'filters',
      type: () => FeaturedCollectionsFilter,
      nullable: true,
    })
    filters: FeaturedCollectionsFilter,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AssetsResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [collections, count] =
      await this.featuredService.getFeaturedCollections(limit, offset, filters);
    return PageResponse.mapResponse<Collection>(
      collections || [],
      pagination,
      count || 0,
      offset,
      limit,
    );
  }

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Mutation(() => Boolean)
  async addFeaturedCollection(
    @Args('collection')
    collection: string,
    @Args('type', { type: () => FeaturedCollectionTypeEnum })
    type: FeaturedCollectionTypeEnum,
  ): Promise<boolean> {
    return await this.featuredService.addFeaturedCollection(collection, type);
  }

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Mutation(() => Boolean)
  async removeFeaturedCollection(
    @Args('collection')
    collection: string,
  ): Promise<boolean> {
    return await this.featuredService.removeFeaturedCollection(collection);
  }
}
