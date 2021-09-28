import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
  Int,
  Context,
} from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { AssetsService } from './assets.service';
import {
  Asset,
  CreateNftArgs,
  TransferNftArgs,
  HandleQuantityArgs,
} from './models';
import { GraphQLUpload } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import { TransactionNode } from '../transaction';
import { Auction } from '../auctions/models';
import { AddLikeArgs } from './models/add-like.dto';
import { RemoveLikeArgs } from './models/remove-like.dto';
import { AssetsLikesService } from './assets-likes.service';
import AssetsResponse from './AssetsResponse';
import ConnectionArgs from '../ConnectionArgs';
import { connectionFromArraySlice } from 'graphql-relay';
import { AssetsFilter } from '../filtersTypes';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { User } from '../user';
import { Account } from '../accounts/models/Account.dto';
import { AccountsProvider } from '../accounts/accounts.loader';
import { AuctionsProvider } from 'src/modules/auctions/asset-auctions.loader';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { AssetLikesProvider } from './asset-likes-count.loader';

@Resolver(() => Asset)
export class AssetsResolver extends BaseResolver(Asset) {
  constructor(
    private assetsService: AssetsService,
    private assetsLikesService: AssetsLikesService,
    private accountsProvider: AccountsProvider,
    private assetsLikeProvider: AssetLikesProvider,
    private auctionsProvider: AuctionsProvider,
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
    return this.mapResponse<Asset>(assets, pagination, count, offset, limit);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async createNft(
    @Args('input') input: CreateNftArgs,
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    @User() user: any,
  ): Promise<TransactionNode> {
    input.file = file;
    return await this.assetsService.createNft(user.publicKey, input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async addSftQuantity(
    @Args('input') input: HandleQuantityArgs,
  ): Promise<TransactionNode> {
    return await this.assetsService.addQuantity(input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async burnQuantity(
    @Args('input') input: HandleQuantityArgs,
  ): Promise<TransactionNode> {
    return await this.assetsService.burnQuantity(input);
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
    const assetLikes = await this.assetsLikeProvider.getAssetLikesCount(
      identifier,
    );
    return assetLikes ? assetLikes[0]?.likesCount : null;
  }

  @ResolveField('isLiked', () => Boolean)
  isLiked(@Parent() asset: Asset, @Args('byAddress') byAddress: string) {
    const { identifier } = asset;
    return this.assetsLikesService.isAssetLiked(identifier, byAddress);
  }

  @ResolveField('auctions', () => [Auction])
  async auctions(@Parent() asset: Asset) {
    const { identifier } = asset;
    if (!identifier) {
      return null;
    }
    const auctions = await this.auctionsProvider.getAuctionsByIdentifier(
      identifier,
    );
    return auctions
      ? auctions?.map((auction: AuctionEntity) => Auction.fromEntity(auction))
      : null;
  }

  @ResolveField('lowestAuction', () => Auction)
  async lowestAuction(@Parent() asset: Asset) {
    const { identifier } = asset;
    if (!identifier) {
      return null;
    }
    const auctions = await this.auctionsProvider.getAuctionsByIdentifier(
      identifier,
    );
    return auctions ? Auction.fromEntity(auctions[0]) : null;
  }

  @ResolveField('creator', () => Account)
  async creator(@Parent() asset: Asset) {
    const { creatorAddress } = asset;

    if (!creatorAddress) return null;
    const account = await this.accountsProvider.getAccountByAddress(
      creatorAddress,
    );
    return Account.fromEntity(account);
  }

  private mapResponse<T>(
    returnList: T[],
    args: ConnectionArgs,
    count: number,
    offset: number,
    limit: number,
  ) {
    const page = connectionFromArraySlice(returnList, args, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return {
      edges: page.edges,
      pageInfo: page.pageInfo,
      pageData: { count, limit, offset },
    };
  }
}
