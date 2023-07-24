import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Marketplace } from './models';
import { UseGuards } from '@nestjs/common';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { MarketplacesService } from './marketplaces.service';
import { WhitelistCollectionArgs } from './models/WhitelistCollectionArgs';
import { WhitelistCollectionRequest } from './models/requests/whitelistMinterRequest';

@Resolver(() => Marketplace)
export class MarketplacesMutationsResolver extends BaseResolver(Marketplace) {
  constructor(private marketplaceService: MarketplacesService) {
    super();
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistCollectionOnMarketplace(
    @Args('input') input: WhitelistCollectionArgs,
  ): Promise<Boolean> {
    return await this.marketplaceService.whitelistCollectionOnMarketplace(
      WhitelistCollectionRequest.fromArgs(input),
    );
  }
}
