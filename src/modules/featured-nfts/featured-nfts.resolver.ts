import { Resolver, Query, Args } from '@nestjs/graphql';
import { Asset, AssetsResponse } from '../assets/models';
import { BaseResolver } from '../base.resolver';
import ConnectionArgs from '../ConnectionArgs';
import PageResponse from '../PageResponse';
import { FeaturedNftsService } from './featured-nfts.service';

@Resolver(() => Asset)
export class FeaturedNftsResolver extends BaseResolver(Asset) {
  constructor(private featuredNftsService: FeaturedNftsService) {
    super();
  }

  @Query(() => AssetsResponse)
  async featuredNfts(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AssetsResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [assets, count] = await this.featuredNftsService.getFeaturedNfts(
      limit,
      offset,
    );
    return PageResponse.mapResponse<Asset>(
      assets,
      pagination,
      count,
      offset,
      limit,
    );
  }
}
