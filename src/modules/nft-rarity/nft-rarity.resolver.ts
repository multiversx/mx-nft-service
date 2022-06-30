import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { NftRarityService } from './nft-rarity.service';

@Resolver()
export class NftRarityResolver {
  constructor(private nftRarityService: NftRarityService) {}

  @Query(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async updateNftRarities(
    @Args('collectionTicker')
    collectionTicker: string,
  ): Promise<boolean> {
    return await this.nftRarityService.updateRarities(collectionTicker);
  }
}
