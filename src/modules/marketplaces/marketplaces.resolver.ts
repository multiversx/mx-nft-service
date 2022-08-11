import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { MarketplacesService } from './marketplaces.service';
import { Marketplace } from './models/Marketplace.dto';
import { MarketplacesResponse } from './models';

@Resolver(() => Marketplace)
export class MarketplacesResolver extends BaseResolver(Marketplace) {
  constructor(private marketplaceService: MarketplacesService) {
    super();
  }

  @Query(() => MarketplacesResponse)
  async marketplaces(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const campaigns = await this.marketplaceService.getMarketplaces(
      limit,
      offset,
    );
    return PageResponse.mapResponse<Marketplace>(
      campaigns?.items || [],
      pagination,
      campaigns?.count || 0,
      offset,
      limit,
    );
  }
}
