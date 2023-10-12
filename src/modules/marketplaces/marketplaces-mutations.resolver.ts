import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Marketplace } from './models';
import { MarketplacesService } from './marketplaces.service';
import { WhitelistCollectionArgs } from './models/WhitelistCollectionArgs';
import { WhitelistCollectionRequest } from './models/requests/WhitelistCollectionOnMarketplaceRequest';
import { WhitelistMarketplaceArgs } from './models/WhitelistMarketplaceArgs';
import { WhitelistMarketplaceRequest } from './models/requests/WhitelistMarketplaceRequest';
import { UseGuards } from '@nestjs/common';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { UpdateMarketplaceArgs } from './models/UpdateMarketplaceArgs';
import { UpdateMarketplaceRequest } from './models/requests/UpdateMarketplaceRequest';

@Resolver(() => Marketplace)
export class MarketplacesMutationsResolver extends BaseResolver(Marketplace) {
  constructor(private marketplaceService: MarketplacesService) {
    super();
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistCollectionOnMarketplace(@Args('input') input: WhitelistCollectionArgs): Promise<Boolean> {
    console.log('Whitelist collection', { input });
    return this.marketplaceService.whitelistCollectionOnMarketplace(WhitelistCollectionRequest.fromArgs(input));
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async updateMarketplace(@Args('input') input: UpdateMarketplaceArgs): Promise<Boolean> {
    console.log('update marketplace', { input });
    return this.marketplaceService.updateMarketplace(UpdateMarketplaceRequest.fromArgs(input));
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistMarketplace(@Args('input') input: WhitelistMarketplaceArgs): Promise<Boolean> {
    console.log('whitelist marketplace', { input });
    return this.marketplaceService.whitelistMarketplace(WhitelistMarketplaceRequest.fromArgs(input));
  }
}
