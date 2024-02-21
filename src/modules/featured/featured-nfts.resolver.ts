import { Resolver, Query, Args } from '@nestjs/graphql';
import { Asset, AssetsResponse } from '../assets/models';
import { BaseResolver } from '../common/base.resolver';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { FeaturedService } from './featured.service';

@Resolver(() => Asset)
export class FeaturedNftsResolver extends BaseResolver(Asset) {
  constructor(private featuredNftsService: FeaturedService) {
    super();
  }

  @Query(() => AssetsResponse)
  async featuredNfts(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AssetsResponse> {
    const { limit, offset } = getPagingParameters(pagination);
    const [assets, count] = await this.featuredNftsService.getFeaturedNfts(limit, offset);
    return PageResponse.mapResponse<Asset>(assets || [], pagination, count || 0, offset, limit);
  }
}
