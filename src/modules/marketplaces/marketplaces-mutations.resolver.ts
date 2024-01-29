import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Marketplace } from './models';
import { MarketplacesService } from './marketplaces.service';
import { RemoveWhitelistCollectionArgs, WhitelistCollectionArgs } from './models/WhitelistCollectionArgs';
import { RemoveWhitelistCollectionRequest, WhitelistCollectionRequest } from './models/requests/WhitelistCollectionOnMarketplaceRequest';
import { WhitelistMarketplaceArgs } from './models/WhitelistMarketplaceArgs';
import { WhitelistMarketplaceRequest } from './models/requests/WhitelistMarketplaceRequest';
import { UseGuards } from '@nestjs/common';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { UpdateMarketplaceArgs } from './models/UpdateMarketplaceArgs';
import { UpdateMarketplaceRequest } from './models/requests/UpdateMarketplaceRequest';
import { UpdateMarketplaceStateArgs } from './models/UpdateMarketplaceStateArgs';
import { MarketplaceState } from './models/MarketplaceType.enum';

@Resolver(() => Marketplace)
export class MarketplacesMutationsResolver extends BaseResolver(Marketplace) {
  constructor(private marketplaceService: MarketplacesService) {
    super();
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistCollectionOnMarketplace(@Args('input') input: WhitelistCollectionArgs): Promise<Boolean> {
    return this.marketplaceService.whitelistCollectionOnMarketplace(WhitelistCollectionRequest.fromArgs(input));
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async removeWhitelistCollection(@Args('input') input: RemoveWhitelistCollectionArgs): Promise<Boolean> {
    return this.marketplaceService.removeWhitelistCollection(RemoveWhitelistCollectionRequest.fromArgs(input));
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async updateMarketplace(@Args('input') input: UpdateMarketplaceArgs): Promise<Boolean> {
    return this.marketplaceService.updateMarketplace(UpdateMarketplaceRequest.fromArgs(input));
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistMarketplace(@Args('input') input: WhitelistMarketplaceArgs): Promise<Boolean> {
    return this.marketplaceService.whitelistMarketplace(WhitelistMarketplaceRequest.fromArgs(input));
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async disableMarketplace(@Args('input') input: UpdateMarketplaceStateArgs): Promise<Boolean> {
    return this.marketplaceService.disableMarketplace(input.marketplaceScAddress, MarketplaceState.Disable);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async enableMarketplace(@Args('input') input: UpdateMarketplaceStateArgs): Promise<Boolean> {
    return this.marketplaceService.enableMarketplace(input.marketplaceScAddress, MarketplaceState.Enable);
  }
}
