import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { FlagNftService } from './flag-nft.service';
import { FlagCollectionInput, FlagNftInput } from './models/flag-nft.input';
import { NftRarityService } from '../nft-rarity/nft-rarity.service';
import { NftTraitsService } from '../nft-traits/nft-traits.service';
import { UpdateNftTraitsResponse } from '../nft-traits/models/update-nft-traits-response';
import { MarketplaceEventsIndexingService } from '../marketplaces/marketplaces-events-indexing.service';
import { MarketplaceEventsIndexingArgs } from '../marketplaces/models/MarketplaceEventsIndexingArgs';
import { MarketplaceEventsIndexingRequest } from '../marketplaces/models/MarketplaceEventsIndexingRequest';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from '../rabbitmq/cache-invalidation/events/changed.event';
import { MarketplacesReindexService } from '../marketplaces/marketplaces-reindex.service';
import { ReportsService } from '../reports/reports.service';
import { ClearReportCollectionInput, ClearReportInput } from './models/clear-report.input';
import { MarketplaceReindexDataArgs } from '../marketplaces/models/MarketplaceReindexDataArgs';
import { GraphQLError } from 'graphql';
import { ScamUpdatePublisherService } from '../rabbitmq/elastic-updates/scam-trigger/scam-update-publiser.service';
import { ScamUpdateInput } from './models/scam-update.input';

@Resolver(() => Boolean)
export class AdminOperationsResolver {
  constructor(
    private readonly logger: Logger,
    private readonly flagService: FlagNftService,
    private reportNfts: ReportsService,
    private readonly nftRarityService: NftRarityService,
    private readonly nftTraitService: NftTraitsService,
    private readonly cacheEventsPublisherService: CacheEventsPublisherService,
    private readonly scamUpdatePublisherService: ScamUpdatePublisherService,
    private readonly marketplaceEventsIndexingService: MarketplaceEventsIndexingService,
    private readonly marketplacesReindexService: MarketplacesReindexService,
  ) { }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  flagNft(@Args('input', { type: () => FlagNftInput }) input: FlagNftInput): Promise<boolean> {
    return this.flagService.updateNftNSFWByAdmin(input.identifier, input.nsfwFlag);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  clearReportNft(@Args('input', { type: () => ClearReportInput }) input: ClearReportInput): Promise<boolean> {
    return this.reportNfts.clearNftReport(input.identifier);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  clearReportCollection(
    @Args('input', { type: () => ClearReportCollectionInput })
    input: ClearReportCollectionInput,
  ): Promise<boolean> {
    return this.reportNfts.clearCollectionReport(input.collectionIdentifier);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  flagCollection(
    @Args('input', { type: () => FlagCollectionInput })
    input: FlagCollectionInput,
  ): Promise<boolean> {
    return this.flagService.updateCollectionNftsNSFWByAdmin(input.collection, input.nsfwFlag);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async updateCollectionRarities(
    @Args('collectionTicker')
    collectionTicker: string,
  ): Promise<boolean> {
    try {
      return await this.nftRarityService.updateCollectionRarities(collectionTicker);
    } catch (error) {
      throw new GraphQLError(error);
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
      throw new GraphQLError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async updateCollectionTraits(
    @Args('collectionTicker')
    collectionTicker: string,
  ): Promise<boolean> {
    try {
      return await this.nftTraitService.updateCollectionTraits(collectionTicker);
    } catch (error) {
      throw new GraphQLError(error);
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
      throw new GraphQLError(error);
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
      throw new GraphQLError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async reindexMarketplaceEvents(
    @Args('input')
    input: MarketplaceEventsIndexingArgs,
  ): Promise<boolean> {
    this.marketplaceEventsIndexingService
      .reindexMarketplaceEvents(MarketplaceEventsIndexingRequest.fromMarketplaceEventsIndexingArgs(input))
      .catch((error) => {
        this.logger.error(error);
      });
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async reindexMarketplaceData(
    @Args('input')
    input: MarketplaceReindexDataArgs,
  ): Promise<boolean> {
    this.marketplacesReindexService.reindexMarketplaceData(input).catch((error) => {
      this.logger.error(error);
    });
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async trigerScamUpdate(@Args('input', { type: () => ScamUpdateInput }) input: ScamUpdateInput): Promise<boolean> {
    this.scamUpdatePublisherService.publish({ collectionIdentifier: input.collectionIdentifier, type: input.type });
    return true;
  }
}
