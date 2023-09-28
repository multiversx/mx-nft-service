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

@Resolver(() => Marketplace)
export class MarketplacesMutationsResolver extends BaseResolver(Marketplace) {
  constructor(private marketplaceService: MarketplacesService) {
    super();
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistCollectionOnMarketplace(@Args('input') input: WhitelistCollectionArgs): Promise<Boolean> {
    return await this.marketplaceService.whitelistCollectionOnMarketplace(WhitelistCollectionRequest.fromArgs(input));
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistMarketplace(@Args('input') input: WhitelistMarketplaceArgs): Promise<Boolean> {
    return await this.marketplaceService.whitelistMarketplace(WhitelistMarketplaceRequest.fromArgs(input));
  }
}
