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

@Resolver(() => Asset)
export class AssetsResolver extends BaseResolver(Asset) {
  constructor(
    private assetsService: AssetsService,
    private assetsLikesService: AssetsLikesService,
    private accountsProvider: AccountsProvider,
    private assetsLikeProvider: AssetLikesProvider,
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
    const [assets, count] = await this.assetsService.getAssets(
      offset,
      limit,
      filters,
    );
    return PageResponse.mapResponse<Asset>(
      assets,
      pagination,
      count,
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
    return await this.assetsService.addQuantity(user.publicKey, input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async burnQuantity(
    @Args('input') input: HandleQuantityArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
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
    return this.assetsLikesService.addLike(input.identifier, user.publicKey);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  removeLike(
    @Args('input') input: RemoveLikeArgs,
    @User() user: any,
  ): Promise<boolean> {
    return this.assetsLikesService.removeLike(input.identifier, user.publicKey);
  }

  @ResolveField('likesCount', () => Int)
  async likesCount(@Parent() asset: Asset) {
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
    return await this.assetSupplyProvider.getSupply(identifier);
  }

  @ResolveField('isLiked', () => Boolean)
  isLiked(@Parent() asset: Asset, @Args('byAddress') byAddress: string) {
    const { identifier } = asset;
    return this.assetsLikesService.isAssetLiked(identifier, byAddress);
  }

  @ResolveField('totalRunningAuctions', () => String)
  async totalRunningAuctions(@Parent() asset: Asset) {
    const { identifier } = asset;
    const assetAuctions = await this.assetsAuctionsProvider.load(identifier);
    return assetAuctions ? assetAuctions[0]?.auctionsCount : 0;
  }

  @ResolveField('hasAvailableAuctions', () => Boolean)
  async hasAvailableAuctions(@Parent() asset: Asset) {
    const { identifier } = asset;
    const assetAuctions = await this.assetsAuctionsProvider.load(identifier);
    return assetAuctions && assetAuctions[0]?.auctionsCount > 0 ? true : false;
  }

  @ResolveField('totalAvailableTokens', () => String)
  async totalAvailableTokens(@Parent() asset: Asset) {
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
