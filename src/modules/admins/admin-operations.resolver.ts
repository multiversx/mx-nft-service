import { Query, Resolver, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { FlagNftService } from './flag-nft.service';
import { FlagNftInput } from './models/flag-nft.input';
import { ApolloError } from 'apollo-server-express';
import { NftRarityService } from '../nft-rarity/nft-rarity.service';

@Resolver(() => Boolean)
export class AdminOperationsResolver {
  constructor(
    private readonly flagService: FlagNftService,
    private readonly nftRarityService: NftRarityService,
  ) {}

  @Mutation(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  flagNft(
    @Args('input', { type: () => FlagNftInput }) input: FlagNftInput,
  ): Promise<boolean> {
    return this.flagService.updateNftNSFWByAdmin(
      input.identifier,
      input.nsfwFlag,
    );
  }

  @Mutation(() => Boolean)
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

  @Mutation(() => Boolean)
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
