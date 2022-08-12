import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { MarketplacesService } from './marketplaces.service';
import { Marketplace } from './models/Marketplace.dto';
import { MarketplacesResponse } from './models';
import { NftMarketplaceAbiService } from '../auctions/nft-marketplace.abi.service';

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
