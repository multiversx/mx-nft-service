import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { FlagNftService } from './flag-nft.service';
import { FlagCollectionInput, FlagNftInput } from './models/flag-nft.input';
import { ApolloError } from 'apollo-server-express';
import { NftRarityService } from '../nft-rarity/nft-rarity.service';
import { NftTraitsService } from '../nft-traits/nft-traits.service';
import { MarketplaceFilters } from '../marketplaces/models/Marketplace.Filter';
import { MarketplaceEventsIndexingService } from '../marketplaces/marketplaces-events-indexing.service';

@Resolver(() => Boolean)
export class AdminOperationsResolver {
  constructor(
    private readonly flagService: FlagNftService,
    private readonly nftRarityService: NftRarityService,
    private readonly nftTraitService: NftTraitsService,
    private readonly marketplaceEventsIndexingService: MarketplaceEventsIndexingService,
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
  flagCollection(
    @Args('input', { type: () => FlagCollectionInput })
    input: FlagCollectionInput,
  ): Promise<boolean> {
    return this.flagService.updateCollectionNftsNSFWByAdmin(
      input.collection,
      input.nsfwFlag,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  async updateCollectionRarities(
    @Args('collectionTicker')
    collectionTicker: string,
  ): Promise<boolean> {
    try {
      return await this.nftRarityService.updateCollectionRarities(
        collectionTicker,
      );
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  async validateCollectionRarities(
    @Args('collectionTicker')
    collectionTicker: string,
  ): Promise<boolean> {
    try {
      return await this.nftRarityService.validateRarities(collectionTicker);
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  async updateCollectionTraits(
    @Args('collectionTicker')
    collectionTicker: string,
  ): Promise<boolean> {
    try {
      return await this.nftTraitService.updateCollectionTraits(
        collectionTicker,
      );
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  async updateNftTraits(
    @Args('identifier')
    identifier: string,
  ): Promise<boolean> {
    try {
      return await this.nftTraitService.updateNftTraits(identifier);
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  async reindexMarketplaceEvents(
    @Args('filters')
    filters: MarketplaceFilters,
    @Args('beforeTimestamp', { nullable: true })
    beforeTimestamp?: number,
    @Args('afterTimestamp', { nullable: true })
    afterTimestamp?: number,
    @Args('stopIfDuplicates', { nullable: true })
    stopIfDuplicates?: boolean,
  ): Promise<boolean> {
    try {
      await this.marketplaceEventsIndexingService.reindexMarketplaceEvents(
        filters,
        beforeTimestamp,
        afterTimestamp,
        stopIfDuplicates,
      );
      return true;
    } catch (error) {
      throw new ApolloError(error);
    }
  }
}
