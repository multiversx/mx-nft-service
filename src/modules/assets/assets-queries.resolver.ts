import { Resolver, Query, Args, ResolveField, Parent, Int } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Asset, AssetsResponse, Metadata, NftTypeEnum } from './models';
import { Auction } from '../auctions/models';
import { Account } from '../account-stats/models/Account.dto';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AssetLikesProvider } from './loaders/asset-likes-count.loader';
import { AssetAuctionsCountProvider } from './loaders/asset-auctions-count.loader';
import { AssetAvailableTokensCountProvider } from './loaders/asset-available-tokens-count.loader';
import { AssetsSupplyLoader } from './loaders/assets-supply.loader';
import { AssetScamInfoProvider } from './loaders/assets-scam-info.loader';
import { IsAssetLikedProvider } from './loaders/asset-is-liked.loader';
import { LowestAuctionProvider } from '../auctions/loaders/lowest-auctions.loader';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import { AssetsFilter } from '../common/filters/filtersTypes';
import PageResponse from '../common/PageResponse';
import { AssetsViewsLoader } from './loaders/assets-views.loader';
import { Address } from '@multiversx/sdk-core';
import { genericDescriptions, mxConfig } from 'src/config';
import { FeaturedMarketplaceProvider } from '../auctions/loaders/featured-marketplace.loader';
import { Rarity } from './models/Rarity';
import { AssetRarityInfoProvider } from './loaders/assets-rarity-info.loader';
import { AssetsGetterService } from './assets-getter.service';
import { InternalMarketplaceProvider } from './loaders/internal-marketplace.loader';
import { Marketplace } from '../marketplaces/models';
import { MarketplaceFilters } from '../marketplaces/models/Marketplace.Filter';
import { LowestAuctionForMarketplaceProvider } from '../auctions/loaders/lowest-auctions-for-marketplace.loader';
import { ArtistAddressProvider } from '../artists/artists.loader';
import { AssetsSortingEnum } from './models/Assets-Sorting.enum';
import { randomBetween } from 'src/utils/helpers';
import { ScamInfo } from './models/ScamInfo.dto';
import { IsTicketProvider } from './loaders/asset-is-ticket.loader';

@Resolver(() => Asset)
export class AssetsQueriesResolver extends BaseResolver(Asset) {
  constructor(
    private assetsService: AssetsGetterService,
    private accountsProvider: AccountsProvider,
    private artistAddressProvider: ArtistAddressProvider,
    private assetsLikeProvider: AssetLikesProvider,
    private assetsViewsProvider: AssetsViewsLoader,
    private isAssetLikedProvider: IsAssetLikedProvider,
    private assetSupplyProvider: AssetsSupplyLoader,
    private assetsAuctionsProvider: AssetAuctionsCountProvider,
    private assetAvailableTokensCountProvider: AssetAvailableTokensCountProvider,
    private lowestAuctionProvider: LowestAuctionProvider,
    private lowestAuctionForMarketplaceProvider: LowestAuctionForMarketplaceProvider,
    private assetScamProvider: AssetScamInfoProvider,
    private assetRarityProvider: AssetRarityInfoProvider,
    private marketplaceProvider: FeaturedMarketplaceProvider,
    private internalMarketplaceProvider: InternalMarketplaceProvider,
    private isTicketProvider: IsTicketProvider,
  ) {
    super();
  }

  @Query(() => AssetsResponse)
  async assets(
    @Args({ name: 'filters', type: () => AssetsFilter, nullable: true })
    filters: AssetsFilter,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
    @Args({ name: 'sorting', type: () => AssetsSortingEnum, nullable: true })
    sorting: AssetsSortingEnum,
  ): Promise<AssetsResponse> {
    const { limit, offset } = getPagingParameters(pagination);
    const response = await this.assetsService.getAssets(offset, limit, filters, sorting);

    return PageResponse.mapResponse<Asset>(response?.items || [], pagination, response?.count || 0, offset, limit);
  }

  @ResolveField('likesCount', () => Int)
  async likesCount(@Parent() asset: Asset) {
    const { identifier } = asset;
    const assetLikes = await this.assetsLikeProvider.load(identifier);
    return assetLikes || 0;
  }

  @ResolveField('viewsCount', () => Int)
  async viewsCount(@Parent() asset: Asset) {
    const { identifier } = asset;
    const assetviews = await this.assetsViewsProvider.load(identifier);
    return assetviews?.value ?? 0;
  }

  @ResolveField('supply', () => String)
  async supply(@Parent() asset: Asset) {
    const { identifier, type } = asset;
    if (type === NftTypeEnum.NonFungibleESDT) {
      return '1';
    }
    const assetSupply = await this.assetSupplyProvider.load(identifier);
    return assetSupply?.value ?? 0;
  }

  @ResolveField('isLiked', () => Boolean)
  async isLiked(@Parent() asset: Asset, @Args('byAddress') byAddress: string) {
    const { identifier } = asset;
    const assetLikes = await this.isAssetLikedProvider.load(`${identifier}_${byAddress}`);
    return !!assetLikes?.value ?? false;
  }

  @ResolveField('totalRunningAuctions', () => String)
  async totalRunningAuctions(@Parent() asset: Asset) {
    const { identifier } = asset;
    const assetAuctions = await this.assetsAuctionsProvider.load(identifier);
    return assetAuctions?.value ?? 0;
  }

  @ResolveField('hasAvailableAuctions', () => Boolean)
  async hasAvailableAuctions(@Parent() asset: Asset) {
    const { identifier } = asset;
    const assetAuctions = await this.assetsAuctionsProvider.load(identifier);
    return !!assetAuctions?.value ?? false;
  }

  @ResolveField('totalAvailableTokens', () => String)
  async totalAvailableTokens(@Parent() asset: Asset) {
    const { identifier } = asset;
    const availableTokens = await this.assetAvailableTokensCountProvider.load(identifier);
    return availableTokens?.value ?? 0;
  }

  @ResolveField('scamInfo', () => ScamInfo)
  async scamInfo(@Parent() asset: Asset) {
    const { identifier } = asset;
    const scamInfo = await this.assetScamProvider.load(identifier);
    const scamInfoValue = scamInfo.value;
    return scamInfoValue && Object.keys(scamInfoValue).length > 1 && ScamInfo.isScam(scamInfoValue) ? scamInfoValue : null;
  }

  @ResolveField('rarity', () => Rarity)
  async rarity(@Parent() asset: Asset) {
    if (asset.rarity) {
      return asset.rarity;
    }
    const { identifier } = asset;
    const rarityRaw = await this.assetRarityProvider.load(identifier);
    return Rarity.fromNftRarity(rarityRaw.value);
  }

  @ResolveField('lowestAuction', () => Auction)
  async lowestAuction(
    @Parent() asset: Asset,
    @Args({ name: 'filters', type: () => MarketplaceFilters, nullable: true })
    filters: MarketplaceFilters,
  ) {
    const { identifier } = asset;
    if (!identifier) {
      return null;
    }

    if (filters?.marketplaceKey) {
      const auctions = await this.lowestAuctionForMarketplaceProvider.load(`${identifier}_${filters?.marketplaceKey}`);
      return auctions?.value ? Auction.fromEntity(auctions?.value) : null;
    }
    const auctions = await this.lowestAuctionProvider.load(identifier);
    return auctions?.value ? Auction.fromEntity(auctions?.value) : null;
  }

  @ResolveField('creator', () => Account)
  async creator(@Parent() asset: Asset) {
    const { creatorAddress } = asset;

    if (!creatorAddress) return null;
    const account = await this.accountsProvider.load(creatorAddress);
    return Account.fromEntity(account?.value, creatorAddress);
  }

  @ResolveField('artist', () => Account)
  async artist(@Parent() asset: Asset) {
    const { creatorAddress } = asset;

    const address = new Address(creatorAddress);
    let artistAddress: string = creatorAddress;

    if (!creatorAddress) return null;

    if (address.isContractAddress()) {
      const response = await this.artistAddressProvider.load(creatorAddress);
      artistAddress = response?.value ? response?.value?.owner : creatorAddress;
    }
    const account = await this.accountsProvider.load(artistAddress);
    return Account.fromEntity(account?.value, artistAddress);
  }

  @ResolveField(() => Account)
  async owner(@Parent() asset: Asset) {
    const { ownerAddress } = asset;

    if (!ownerAddress) return null;
    const account = await this.accountsProvider.load(ownerAddress);
    return Account.fromEntity(account?.value, ownerAddress);
  }

  @ResolveField(() => [Marketplace])
  async marketplaces(@Parent() asset: Asset) {
    const { ownerAddress, identifier, collection, type } = asset;
    if (type === NftTypeEnum.NonFungibleESDT) {
      return this.getMarketplaceForNft(ownerAddress, collection, identifier);
    }
    if (type === NftTypeEnum.SemiFungibleESDT) {
      return this.getMarketplaceForSft(collection, identifier);
    }
    return null;
  }

  @ResolveField(() => String)
  aggregatorUrl(@Parent() asset: Asset): string {
    return `${process.env.ELROND_MARKETPLACE}/nfts/${asset.identifier}`;
  }

  @ResolveField(() => Metadata)
  metadata(@Parent() asset: Asset) {
    if (!asset?.metadata) {
      asset.metadata = new Metadata();
    }

    if (asset.metadata?.description) {
      return asset.metadata;
    }

    if (asset.branding?.description) {
      asset.metadata.description = asset.branding.description;
      return asset.metadata;
    }

    const descriptions = genericDescriptions.forAssets;
    const randomIdx = randomBetween(0, descriptions.length);
    asset.metadata.description = descriptions[randomIdx];
    return asset.metadata;
  }

  @ResolveField('isTicket', () => Boolean)
  async isTicket(@Parent() asset: Asset) {
    const { collection } = asset;
    const isAssetTicket = await this.isTicketProvider.load(collection);
    return isAssetTicket?.value ?? false;
  }

  private async getMarketplaceForNft(ownerAddress: string, collection: string, identifier: string): Promise<Marketplace[]> {
    if (!ownerAddress) return null;
    const address = Address.fromString(ownerAddress);
    if (address.isContractAddress() && !address.equals(new Address(mxConfig.nftMarketplaceAddress))) {
      const marketplace = await this.marketplaceProvider.load(ownerAddress);

      const mappedMarketplace = Marketplace.fromEntity(marketplace?.value, identifier);
      return mappedMarketplace ? [mappedMarketplace] : null;
    }

    if (address.isContractAddress()) {
      const marketplace = await this.internalMarketplaceProvider.load(collection);

      const mappedMarketplace = Marketplace.fromEntity(marketplace?.value, identifier);
      return mappedMarketplace ? [mappedMarketplace] : null;
    }
  }

  private async getMarketplaceForSft(collection: string, identifier: string): Promise<Marketplace[]> {
    const assetAuctions = await this.assetsAuctionsProvider.load(identifier);
    if (!!assetAuctions?.value) {
      const marketplace = await this.internalMarketplaceProvider.load(collection);
      const mappedMarketplace = Marketplace.fromEntity(marketplace?.value, identifier);
      return mappedMarketplace ? [mappedMarketplace] : null;
    }
    return null;
  }
}
