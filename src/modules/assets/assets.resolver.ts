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
import { Account } from '../accounts/models/account.dto';
import { AssetsService } from './assets.service';
import {
  Asset,
  CreateNftArgs,
  TransferNftArgs,
  Owner,
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
import { IGraphQLContext } from 'src/db/auctions/graphql.types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { User } from '../user';

@Resolver(() => Asset)
export class AssetsResolver extends BaseResolver(Asset) {
  constructor(
    private assetsService: AssetsService,
    private assetsLikesService: AssetsLikesService,
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
  likesCount(@Parent() asset: Asset) {
    const { identifier } = asset;
    return this.assetsLikesService.getAssetLikesCount(identifier);
  }

  @ResolveField('isLiked', () => Boolean)
  isLiked(@Parent() asset: Asset, @Args('byAddress') byAddress: string) {
    const { identifier } = asset;
    return this.assetsLikesService.isAssetLiked(identifier, byAddress);
  }

  @ResolveField('creator', () => Account)
  async creator(@Parent() asset: Asset) {
    const { creatorAddress } = asset;
    const artist = await this.accountsService.getAccountByAddress(
      creatorAddress,
    );
    return artist !== undefined ? artist[0] : undefined;
  }

  @ResolveField('auction', () => Auction)
  async auction(
    @Parent() asset: Asset,
    @Context()
    { assetAuctionLoader: assetAuctionLoader }: IGraphQLContext,
  ) {
    const { identifier } = asset;
    if (!identifier) {
      return null;
    }
    const auctions = await assetAuctionLoader.load(identifier);
    return auctions !== undefined ? Auction.fromEntity(auctions[0]) : null;
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
