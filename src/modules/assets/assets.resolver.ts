import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
  Int,
} from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { AssetsService } from '.';
import {
  Asset,
  CreateNftArgs,
  TransferNftArgs,
  HandleQuantityArgs,
  AddLikeArgs,
  RemoveLikeArgs,
  AssetsResponse,
  NftTypeEnum,
} from './models';
import { GraphQLUpload } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import { TransactionNode } from '../common/transaction';
import { Auction } from '../auctions/models';
import { AssetsLikesService } from './assets-likes.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { User } from '../auth/user';
import { Account } from '../account-stats/models/Account.dto';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AssetLikesProvider } from './loaders/asset-likes-count.loader';
import { AssetAuctionsCountProvider } from './loaders/asset-auctions-count.loader';
import { AssetAvailableTokensCountProvider } from './loaders/asset-available-tokens-count.loader';
import { ContentValidation } from './content.validation.service';
import { AssetScamInfoProvider } from './loaders/assets-scam-info.loader';
import { IsAssetLikedProvider } from './loaders/asset-is-liked.loader';
import { LowestAuctionProvider } from '../auctions/lowest-auctions.loader';
import { AssetsSupplyLoader } from './loaders/assets-supply.loader';
import { AssetsFilter } from '../common/filters/filtersTypes';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/filters/PageResponse';

@Resolver(() => Asset)
export class AssetsResolver extends BaseResolver(Asset) {
  constructor(
    private assetsService: AssetsService,
    private assetsLikesService: AssetsLikesService,
    private accountsProvider: AccountsProvider,
    private assetsLikeProvider: AssetLikesProvider,
    private isAssetLikedProvider: IsAssetLikedProvider,
    private assetSupplyProvider: AssetsSupplyLoader,
    private assetsAuctionsProvider: AssetAuctionsCountProvider,
    private contentValidation: ContentValidation,
    private assetAvailableTokensCountProvider: AssetAvailableTokensCountProvider,
    private lowestAuctionProvider: LowestAuctionProvider,
    private assetScamProvider: AssetScamInfoProvider,
  ) {
    super();
  }

  @Query(() => AssetsResponse)
  async assets(
    @Args({ name: 'filters', type: () => AssetsFilter, nullable: true })
    filters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AssetsResponse> {
    const { limit, offset } = pagination.pagingParams();
    const response = await this.assetsService.getAssets(offset, limit, filters);

    return PageResponse.mapResponse<Asset>(
      response?.items || [],
      pagination,
      response?.count || 0,
      offset,
      limit,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async createNft(
    @Args('input') input: CreateNftArgs,
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    @User() user: any,
  ): Promise<TransactionNode> {
    if (process.env.NODE_ENV === 'production') {
      return new TransactionNode();
    }
    const fileData = await file;

    const contentStatus = (
      await this.contentValidation
        .checkContentType(fileData)
        .checkContentSensitivity(fileData)
    ).getStatus();
    if (contentStatus) {
      input.file = fileData;
      return await this.assetsService.createNft(user.publicKey, input);
    }
    throw Error('Invalid content');
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async addSftQuantity(
    @Args('input') input: HandleQuantityArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    if (process.env.NODE_ENV === 'production') {
      return new TransactionNode();
    }
    return await this.assetsService.addBurnQuantity(
      user.publicKey,
      input,
      'ESDTNFTAddQuantity',
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async burnQuantity(
    @Args('input') input: HandleQuantityArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    if (process.env.NODE_ENV === 'production') {
      return new TransactionNode();
    }
    return await this.assetsService.addBurnQuantity(
      user.publicKey,
      input,
      'ESDTNFTBurn',
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async transferNft(
    @Args('input') input: TransferNftArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    return await this.assetsService.transferNft(user.publicKey, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  addLike(
    @Args('input') input: AddLikeArgs,
    @User() user: any,
  ): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      return Promise.resolve(false);
    }
    return this.assetsLikesService.addLike(input.identifier, user.publicKey);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  removeLike(
    @Args('input') input: RemoveLikeArgs,
    @User() user: any,
  ): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      return Promise.resolve(false);
    }
    return this.assetsLikesService.removeLike(input.identifier, user.publicKey);
  }

  @ResolveField('likesCount', () => Int)
  async likesCount(@Parent() asset: Asset) {
    if (process.env.NODE_ENV === 'production') {
      return 0;
    }
    const { identifier } = asset;
    const assetLikes = await this.assetsLikeProvider.load(identifier);
    return assetLikes ? assetLikes[0]?.likesCount : 0;
  }

  @ResolveField('supply', () => String)
  async supply(@Parent() asset: Asset) {
    const { identifier, type } = asset;
    if (type === NftTypeEnum.NonFungibleESDT) {
      return '1';
    }
    const assetSupply = await this.assetSupplyProvider.load(identifier);
    return assetSupply ? assetSupply[0]?.supply : 0;
  }

  @ResolveField('isLiked', () => Boolean)
  async isLiked(@Parent() asset: Asset, @Args('byAddress') byAddress: string) {
    if (process.env.NODE_ENV === 'production') {
      return Promise.resolve(false);
    }

    const { identifier } = asset;
    const assetLikes = await this.isAssetLikedProvider.load(
      `${identifier}_${byAddress}`,
    );
    return assetLikes ? !!+assetLikes[0]?.liked : false;
  }

  @ResolveField('totalRunningAuctions', () => String)
  async totalRunningAuctions(@Parent() asset: Asset) {
    if (process.env.NODE_ENV === 'production') {
      return '0';
    }
    const { identifier } = asset;
    const assetAuctions = await this.assetsAuctionsProvider.load(identifier);
    return assetAuctions ? assetAuctions[0]?.auctionsCount : 0;
  }

  @ResolveField('hasAvailableAuctions', () => Boolean)
  async hasAvailableAuctions(@Parent() asset: Asset) {
    if (process.env.NODE_ENV === 'production') {
      return Promise.resolve(false);
    }
    const { identifier } = asset;
    const assetAuctions = await this.assetsAuctionsProvider.load(identifier);
    return assetAuctions && assetAuctions[0]?.auctionsCount > 0 ? true : false;
  }

  @ResolveField('totalAvailableTokens', () => String)
  async totalAvailableTokens(@Parent() asset: Asset) {
    if (process.env.NODE_ENV === 'production') {
      return 0;
    }
    const { identifier } = asset;
    const availableTokens = await this.assetAvailableTokensCountProvider.load(
      identifier,
    );
    return availableTokens ? availableTokens[0]?.count : 0;
  }

  @ResolveField('scamInfo', () => String)
  async scamInfo(@Parent() asset: Asset) {
    const { identifier } = asset;
    const scamInfo = await this.assetScamProvider.load(identifier);
    return scamInfo && Object.keys(scamInfo).length !== 0 ? scamInfo : null;
  }

  @ResolveField('lowestAuction', () => Auction)
  async lowestAuction(@Parent() asset: Asset) {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    const { identifier } = asset;
    if (!identifier) {
      return null;
    }
    const auctions = await this.lowestAuctionProvider.load(identifier);
    return auctions && auctions.length > 0
      ? Auction.fromEntity(auctions[0])
      : null;
  }

  @ResolveField('creator', () => Account)
  async creator(@Parent() asset: Asset) {
    const { creatorAddress } = asset;

    if (!creatorAddress) return null;
    const account = await this.accountsProvider.load(creatorAddress);
    return Account.fromEntity(account, creatorAddress);
  }

  @ResolveField(() => Account)
  async owner(@Parent() asset: Asset) {
    const { ownerAddress } = asset;

    if (!ownerAddress) return null;
    const account = await this.accountsProvider.load(ownerAddress);
    return Account.fromEntity(account, ownerAddress);
  }
}
