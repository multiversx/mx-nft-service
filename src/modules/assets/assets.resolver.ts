import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { AccountsService } from '../accounts/accounts.service';
import { BaseResolver } from '../base.resolver';
import { Account } from '../accounts/models/account.dto';
import { AssetsService } from './assets.service';
import {
  Asset,
  AddTagsArgs,
  CreateNftArgs,
  TransferNftArgs,
  Onwer,
  Tag,
} from './models';
import { GraphQLUpload } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import { TransactionNode } from '../transaction';
import { Auction } from '../auctions/models';
import { AuctionsService } from '../auctions/auctions.service';

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

  @Mutation(() => [Tag])
  async addTags(@Args('input') input: AddTagsArgs): Promise<[Tag]> {
    return await this.assetsService.addTags(input);
  }

  @Query(() => [Asset])
  async getAssetsForUser(@Args('address') address: string) {
    return this.assetsService.getAssetsForUser(address);
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
    const { tokenIdentifier } = asset;
    return await this.auctionsService.getActiveAuction(tokenIdentifier);
  }
}
