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
    @Args() args: ConnectionArgs,
  ): Promise<AssetsResponse> {
    const { limit, offset } = args.pagingParams();
    const [assets, count] = await this.assetsService.getAssets(
      offset,
      limit,
      filters,
    );
    return this.mapResponse<Asset>(assets, args, count, offset, limit);
  }

  @Mutation(() => TransactionNode)
  async createNft(
    @Args('input') input: CreateNftArgs,
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
  ): Promise<TransactionNode> {
    input.file = file;
    return await this.assetsService.createNft(input);
  }

  @Mutation(() => TransactionNode)
  async addSftQuantity(
    @Args('input') input: HandleQuantityArgs,
  ): Promise<TransactionNode> {
    return await this.assetsService.addQuantity(input);
  }

  @Mutation(() => TransactionNode)
  async burnQuantity(
    @Args('input') input: HandleQuantityArgs,
  ): Promise<TransactionNode> {
    return await this.assetsService.burnQuantity(input);
  }

  @Mutation(() => TransactionNode)
  async transferNft(
    @Args('input') input: TransferNftArgs,
  ): Promise<TransactionNode> {
    return await this.assetsService.transferNft(input);
  }

  @Mutation(() => Boolean)
  addLike(@Args('input') input: AddLikeArgs): Promise<boolean> {
    const { token, nonce, address } = input;
    return this.assetsLikesService.addLike(token, nonce, address);
  }

  @Mutation(() => Boolean)
  removeLike(@Args('input') input: RemoveLikeArgs): Promise<boolean> {
    const { token, nonce, address } = input;
    return this.assetsLikesService.removeLike(token, nonce, address);
  }

  @ResolveField('likesCount', () => Int)
  likesCount(@Parent() asset: Asset) {
    const { token, nonce } = asset;
    return this.assetsLikesService.getAssetLikesCount(token, nonce);
  }

  @ResolveField('isLiked', () => Boolean)
  isLiked(@Parent() asset: Asset, @Args('byAddress') byAddress: string) {
    const { token, nonce } = asset;
    return this.assetsLikesService.isAssetLiked(token, nonce, byAddress);
  }

  @ResolveField('creator', () => Account)
  async creator(
    @Parent() asset: Asset,
    @Context()
    { accountsLoader: accountsLoader }: IGraphQLContext,
  ) {
    const { creatorAddress } = asset;
    const artist = await accountsLoader.load(creatorAddress);
    return artist !== undefined ? artist[0] : null;
  }

  @ResolveField('currentOwner', () => Account)
  async currentOwner(
    @Parent() asset: Asset,
    @Context()
    { accountsLoader: accountsLoader }: IGraphQLContext,
  ) {
    const { ownerAddress } = asset;
    const ownerAccount = await accountsLoader.load(ownerAddress);
    let owner = new Owner();
    owner.account = ownerAccount !== undefined ? ownerAccount[0] : null;
    return owner;
  }

  @ResolveField('auction', () => Auction)
  async auction(
    @Parent() asset: Asset,
    @Context()
    { assetAuctionLoader: assetAuctionLoader }: IGraphQLContext,
  ) {
    const { identifier } = asset;
    if (identifier) {
      const auctions = await assetAuctionLoader.load(identifier);
      return auctions !== undefined ? auctions[0] : null;
    }
    return null;
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
