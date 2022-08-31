import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { MarketplacesService } from './marketplaces.service';
import { Marketplace } from './models/Marketplace.dto';
import { MarketplacesResponse } from './models';
import { NftMarketplaceAbiService } from '../auctions/nft-marketplace.abi.service';
import { MarketplaceFilters } from './models/Marketplace.Filter';

@Resolver(() => Marketplace)
export class MarketplacesResolver extends BaseResolver(Marketplace) {
  constructor(
    private marketplaceService: MarketplacesService,
    private nftAbiService: NftMarketplaceAbiService,
  ) {
    super();
  }

  @Query(() => MarketplacesResponse)
  async marketplaces(
    @Args({ name: 'filters', type: () => MarketplaceFilters, nullable: true })
    filters: MarketplaceFilters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const marketplaces = await this.marketplaceService.getMarketplaces(
      limit,
      offset,
      filters,
    );
    // todo: investigate
    pagination.after = undefined;
    return PageResponse.mapResponse<Marketplace>(
      marketplaces?.items || [],
      pagination,
      marketplaces?.count || 0,
      0,
      limit,
    );
  }

  @ResolveField(() => String)
  async marketplaceCutPercentage(@Parent() contractInfo: Marketplace) {
    const { address } = contractInfo;

    return address ? await this.nftAbiService.getCutPercentage(address) : null;
  }

  @ResolveField(() => Boolean)
  async isPaused(@Parent() contractInfo: Marketplace) {
    const { address } = contractInfo;
    return address ? await this.nftAbiService.getIsPaused(address) : null;
  }
}
