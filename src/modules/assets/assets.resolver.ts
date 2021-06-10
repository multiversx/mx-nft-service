import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
  Int,
} from '@nestjs/graphql';
import { AccountsService } from '../accounts/accounts.service';
import { BaseResolver } from '../base.resolver';
import { Account } from '../accounts/models/account.dto';
import { AssetsService } from './assets.service';
import {
  Asset,
  CreateNftArgs,
  TransferNftArgs,
  Onwer,
  HandleQuantityArgs,
} from './models';
import { GraphQLUpload } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import { TransactionNode } from '../transaction';
import { Auction } from '../auctions/models';
import { AuctionsService } from '../auctions/auctions.service';
import { AddLikeArgs } from './models/add-like.dto';
import { RemoveLikeArgs } from './models/remove-like.dto';
import { AssetsLikesService } from './assets-likes.service';
import PaginationArgs from '../PaginationArgs.dto';
import AssetsResponse from './AssetsResponse';
import ConnectionArgs from '../ConnectionArgs';
import { connectionFromArraySlice } from 'graphql-relay';

@Resolver(() => Asset)
export class AssetsResolver extends BaseResolver(Asset) {
  constructor(
    private assetsService: AssetsService,
    private accountsService: AccountsService,
    private auctionsService: AuctionsService,
    private assetsLikesService: AssetsLikesService,
  ) {
    super();
  }

  @Query(() => AssetsResponse)
  async getAssets(@Args() args: ConnectionArgs): Promise<AssetsResponse> {
    const { limit, offset } = args.pagingParams();
    const [assets, count] = await this.assetsService.getAllAssets(
      offset,
      limit,
    );
    const page = connectionFromArraySlice(assets, args, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return { page, pageData: { count, limit, offset } };
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

  @Query(() => [Asset])
  async getAssetsForUser(
    @Args('address') address: string,
    @Args('pagArgs') pageInfo: PaginationArgs,
  ) {
    return this.assetsService.getAssetsForUser(address, pageInfo);
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
  async creator(@Parent() asset: Asset) {
    const { creatorAddress } = asset;
    return await this.accountsService.getAccountByAddress(creatorAddress);
  }

  @ResolveField('currentOwner', () => Onwer)
  async currentOwner(@Parent() asset: Asset) {
    const { ownerAddress } = asset;
    return await this.accountsService.getOwnerByAddress(ownerAddress);
  }

  @ResolveField('auction', () => Auction)
  async auction(@Parent() asset: Asset) {
    const { token, nonce } = asset;
    return await this.auctionsService.getActiveAuction(token, nonce);
  }
}
