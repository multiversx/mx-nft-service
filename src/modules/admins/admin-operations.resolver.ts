import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { FlagNftService } from './flag-nft.service';
import { FlagCollectionInput, FlagNftInput } from './models/flag-nft.input';
import { ApolloError } from 'apollo-server-express';
import { NftRarityService } from '../nft-rarity/nft-rarity.service';
import { NftTraitsService } from '../nft-traits/nft-traits.service';
import { UpdateNftTraitsResponse } from '../nft-traits/models/update-nft-traits-response';
import { MarketplaceEventsIndexingService } from '../marketplaces/marketplaces-events-indexing.service';
import { MarketplaceEventsIndexingArgs } from '../marketplaces/models/MarketplaceEventsIndexingArgs';
import { MarketplaceEventsIndexingRequest } from '../marketplaces/models/MarketplaceEventsIndexingRequest';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from '../rabbitmq/cache-invalidation/events/changed.event';

@Resolver(() => Boolean)
export class AdminOperationsResolver {
  constructor(
    private readonly flagService: FlagNftService,
    private readonly nftRarityService: NftRarityService,
    private readonly nftTraitService: NftTraitsService,
    private readonly cacheEventsPublisherService: CacheEventsPublisherService,
    private readonly marketplaceEventsIndexingService: MarketplaceEventsIndexingService,
  ) {}

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  flagNft(
    @Args('input', { type: () => FlagNftInput }) input: FlagNftInput,
  ): Promise<boolean> {
    return this.flagService.updateNftNSFWByAdmin(
      input.identifier,
      input.nsfwFlag,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
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
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
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
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
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
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
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
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async indexTrandingCollections(
    @Args('forTheLastHours')
    forTheLastHours: number = 24,
  ): Promise<boolean> {
    try {
      await this.cacheEventsPublisherService.publish(
        new ChangedEvent({
          id: forTheLastHours,
          type: CacheEventTypeEnum.RefreshTrending,
        }),
      );
      return true;
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  @Mutation(() => UpdateNftTraitsResponse)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async updateNftTraits(
    @Args('identifier')
    identifier: string,
  ): Promise<UpdateNftTraitsResponse> {
    try {
      return await this.nftTraitService.updateNftTraits(identifier);
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async reindexMarketplaceEvents(
    @Args('input')
    input: MarketplaceEventsIndexingArgs,
  ): Promise<boolean> {
    try {
      await this.marketplaceEventsIndexingService.reindexMarketplaceEvents(
        MarketplaceEventsIndexingRequest.fromMarketplaceEventsIndexingArgs(
          input,
        ),
      );
      return true;
    } catch (error) {
      throw new ApolloError(error);
    }
  }
}
