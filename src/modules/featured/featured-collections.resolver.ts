import { Resolver, Query, Args } from '@nestjs/graphql';
import { Asset, AssetsResponse } from '../assets/models';
import { BaseResolver } from '../base.resolver';
import ConnectionArgs from '../ConnectionArgs';
import { Collection } from '../nftCollections/models';
import CollectionResponse from '../nftCollections/models/CollectionResponse';
import PageResponse from '../PageResponse';
import { FeaturedService } from './featured.service';

@Resolver(() => Asset)
export class FeaturedCollectionsResolver extends BaseResolver(Collection) {
  constructor(private featuredService: FeaturedService) {
    super();
  }

  @Query(() => CollectionResponse)
  async featuredCollections(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AssetsResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [collections, count] =
      await this.featuredService.getFeaturedCollections(limit, offset);
    return PageResponse.mapResponse<Collection>(
      collections || [],
      pagination,
      count || 0,
      offset,
      limit,
    );
  }
}
