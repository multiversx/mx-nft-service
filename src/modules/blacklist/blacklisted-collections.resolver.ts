import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { BaseResolver } from '../common/base.resolver';
import { Collection } from '../nftCollections/models';
import { BlacklistedCollectionsService } from './blacklisted-collections.service';

@Resolver(() => Collection)
export class BlacklistedCollectionsResolver extends BaseResolver(Collection) {
  constructor(private blacklistedCollectionsService: BlacklistedCollectionsService) {
    super();
  }

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Mutation(() => Boolean)
  async addBlacklistedCollection(
    @Args('collection')
    collection: string,
  ): Promise<boolean> {
    return await this.blacklistedCollectionsService.addBlacklistedCollection(collection);
  }

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Mutation(() => Boolean)
  async removeBlacklistedCollection(
    @Args('collection')
    collection: string,
  ): Promise<boolean> {
    return await this.blacklistedCollectionsService.removeBlacklistedCollection(collection);
  }

  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  @Query(() => [String])
  async blacklistedCollections(): Promise<string[]> {
    return await this.blacklistedCollectionsService.getBlacklistedCollectionIds();
  }
}
