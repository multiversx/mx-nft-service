import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { NftRarityService } from './nft-rarity.service';

@Resolver()
export class NftRarityResolver {
  constructor(private nftRarityService: NftRarityService) {}

  @Query(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  async updateNftRarities(
    @Args('collectionTicker')
    collectionTicker: string,
  ): Promise<boolean> {
    try {
      return await this.nftRarityService.updateRarities(collectionTicker);
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  @Query(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  async validateNftRarities(
    @Args('collectionTicker')
    collectionTicker: string,
  ): Promise<boolean> {
    try {
      return await this.nftRarityService.validateRarities(collectionTicker);
    } catch (error) {
      throw new ApolloError(error);
    }
  }
}
