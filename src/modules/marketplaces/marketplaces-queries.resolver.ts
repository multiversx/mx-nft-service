import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { MarketplacesService } from './marketplaces.service';
import { Marketplace } from './models/Marketplace.dto';
import { MarketplacesResponse } from './models';
import { NftMarketplaceAbiService } from '../auctions/nft-marketplace.abi.service';
import { MarketplaceFilters } from './models/Marketplace.Filter';
import { MarketplaceTypeEnum } from './models/MarketplaceType.enum';
import { UsdPriceService } from '../usdPrice/usd-price.service';
import { Token } from '../usdPrice/Token.model';

@Resolver(() => Marketplace)
export class MarketplacesQueriesResolver extends BaseResolver(Marketplace) {
  constructor(
    private marketplaceService: MarketplacesService,
    private nftAbiService: NftMarketplaceAbiService,
    private paymentService: UsdPriceService,
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
    const { limit, offset } = getPagingParameters(pagination);
    const marketplaces = await this.marketplaceService.getMarketplaces(limit, offset, filters);
    // todo: investigate
    pagination.after = undefined;
    return PageResponse.mapResponse<Marketplace>(marketplaces?.items || [], pagination, marketplaces?.count || 0, offset, limit);
  }

  @ResolveField(() => String)
  async marketplaceCutPercentage(@Parent() contractInfo: Marketplace) {
    const { address } = contractInfo;

    return address ? await this.nftAbiService.getCutPercentage(address) : null;
  }

  @ResolveField(() => Boolean)
  async isPaused(@Parent() contractInfo: Marketplace) {
    const { address, type } = contractInfo;
    return address && type === MarketplaceTypeEnum.Internal ? await this.nftAbiService.getIsPaused(address) : null;
  }

  @ResolveField(() => [String])
  async acceptedCollectionIdentifiers(@Parent() contractInfo: Marketplace) {
    const { key, type } = contractInfo;
    return key && type === MarketplaceTypeEnum.Internal ? await this.marketplaceService.getCollectionsByMarketplace(key) : null;
  }

  @ResolveField(() => [Token])
  async acceptedPaymentTokens(@Parent() contractInfo: Marketplace) {
    const { acceptedPaymentIdentifiers } = contractInfo;
    if (!acceptedPaymentIdentifiers) return null;
    let response: Token[] = [];
    for (const payment of acceptedPaymentIdentifiers) {
      const paymentData = await this.paymentService.getToken(payment);
      if (paymentData) {
        response.push(paymentData);
      }
    }
    return response;
  }
}
