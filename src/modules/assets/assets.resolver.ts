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
import { Asset, CreateNftArgs, TransferNftArgs, Onwer } from './models';
import { GraphQLUpload } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import { TransactionNode } from '../transaction';
import { Auction } from '../auctions/models';
import { AuctionsService } from '../auctions/auctions.service';
import { AddLikeArgs } from './models/add-like.dto';
import { RemoveLikeArgs } from './models/remove-like.dto';

@Resolver(() => Asset)
export class AssetsResolver extends BaseResolver(Asset) {
  constructor(
    private assetsService: AssetsService,
    private accountsService: AccountsService,
    private auctionsService: AuctionsService,
  ) {
    super();
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
  async transferNft(
    @Args('input') input: TransferNftArgs,
  ): Promise<TransactionNode> {
    return await this.assetsService.transferNft(input);
  }

  @Mutation(() => Boolean)
  addLike(@Args('input') input: AddLikeArgs): Promise<boolean> {
    const { tokenIdentifier, tokenNonce, address } = input;
    return this.assetsService.addLike(tokenIdentifier, tokenNonce, address);
  }

  @Mutation(() => Boolean)
  removeLike(@Args('input') input: RemoveLikeArgs): Promise<boolean> {
    const { tokenIdentifier, tokenNonce, address } = input;
    return this.assetsService.removeLike(tokenIdentifier, tokenNonce, address);
  }

  @Query(() => [Asset])
  async getAssetsForUser(@Args('address') address: string) {
    return this.assetsService.getAssetsForUser(address);
  }

  @ResolveField('likesCount', () => Int)
  likesCount(@Parent() asset: Asset) {
    const { tokenIdentifier, tokenNonce } = asset;
    return this.assetsService.getAssetLikesCount(tokenIdentifier, tokenNonce);
  }

  @ResolveField('isLiked', () => Number)
  isLiked(@Parent() asset: Asset,
    @Args('byAddress') byAddress: string) {
    const { tokenIdentifier, tokenNonce } = asset;
    return this.assetsService.isAssetLiked(tokenIdentifier, tokenNonce, byAddress);
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
    const { tokenIdentifier, tokenNonce } = asset;
    return await this.auctionsService.getActiveAuction(
      tokenIdentifier,
      tokenNonce,
    );
  }
}
