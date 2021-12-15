import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
  Int,
} from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
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
import { TransactionNode } from '../transaction';
import { Auction } from '../auctions/models';
import { AssetsLikesService } from './assets-likes.service';
import ConnectionArgs from '../ConnectionArgs';
import { AssetsFilter } from '../filtersTypes';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { User } from '../user';
import { Account } from '../accounts/models/Account.dto';
import { AccountsProvider } from '../accounts/accounts.loader';
import { AuctionsForAssetProvider } from 'src/modules/auctions';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { AssetLikesProvider } from './asset-likes-count.loader';
import PageResponse from '../PageResponse';
import { AssetAuctionsCountProvider } from './asset-auctions-count.loader';
import { AssetAvailableTokensCountProvider } from './asset-available-tokens-count.loader';
import { MediaMimeTypeEnum } from './models/MediaTypes.enum';
import { AssetsSupplyLoader } from './assets-supply.loader';
import { AssetScamInfoProvider } from './assets-scam-info.loader';
import { IsAssetLikedProvider } from './asset-is-liked.loader';

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
    private assetAvailableTokensCountProvider: AssetAvailableTokensCountProvider,
    private auctionsProvider: AuctionsForAssetProvider,
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
    if (
      !Object.values(MediaMimeTypeEnum).includes(
        fileData.mimetype as MediaMimeTypeEnum,
      )
    )
      throw new Error('unsuported_media_type');
    input.file = fileData;
    return await this.assetsService.createNft(user.publicKey, input);
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
    return await this.assetsService.addQuantity(user.publicKey, input);
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
    return await this.assetsService.burnQuantity(user.publicKey, input);
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
    const { identifier, type, supply } = asset;
    if (type === NftTypeEnum.NonFungibleESDT) {
      return '1';
    }
    if (supply) {
      return supply;
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
    const availableTokens = await this.assetScamProvider.load(identifier);
    return availableTokens;
  }

  @ResolveField('auctions', () => [Auction])
  async auctions(@Parent() asset: Asset) {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    const { identifier } = asset;
    if (!identifier) {
      return null;
    }
    const auctions = await this.auctionsProvider.load(identifier);
    return auctions
      ? auctions?.map((auction: AuctionEntity) => Auction.fromEntity(auction))
      : [];
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
    const auctions = await this.auctionsProvider.load(identifier);
    return auctions && auctions.length > 0
      ? Auction.fromEntity(auctions[0])
      : null;
  }

  @ResolveField('creator', () => Account)
  async creator(@Parent() asset: Asset) {
    const { creatorAddress } = asset;

    if (!creatorAddress) return null;
    const account = await this.accountsProvider.getAccountByAddress(
      creatorAddress,
    );
    return Account.fromEntity(account, creatorAddress);
  }

  @ResolveField(() => Account)
  async owner(@Parent() asset: Asset) {
    const { ownerAddress } = asset;

    if (!ownerAddress) return null;
    const account = await this.accountsProvider.getAccountByAddress(
      ownerAddress,
    );
    return Account.fromEntity(account, ownerAddress);
  }
}
